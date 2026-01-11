import { Request, Response } from 'express';
import { Bug } from '../models/Bug';
import { TestCase } from '../models/TestCase';
import { Project } from '../models/Project';
import { Notification } from '../models/Notification';
import { Task } from '../models/Task';

// Helper to generate friendly ID
const getNextFriendlyId = async (model: any, prefix: string) => {
    const lastItem = await model.findOne({ friendlyId: { $regex: `^${prefix}-` } }).sort({ createdAt: -1 });
    if (!lastItem || !lastItem.friendlyId) return `${prefix}-1`;
    const lastIdNum = parseInt(lastItem.friendlyId.split('-')[1]);
    return `${prefix}-${lastIdNum + 1}`;
};

export const getBugs = async (req: Request, res: Response) => {
    try {
        const bugs = await Bug.find().sort({ createdAt: -1 });
        res.json(bugs);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const createBug = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.user.id;
        const bugData = req.body;

        const friendlyId = await getNextFriendlyId(Bug, 'BUG');

        // Ensure linked ids have no duplicates
        if (bugData.linkedTestCaseIds && Array.isArray(bugData.linkedTestCaseIds)) {
            bugData.linkedTestCaseIds = [...new Set(bugData.linkedTestCaseIds.map(String))];
        }
        if (bugData.linkedTaskIds && Array.isArray(bugData.linkedTaskIds)) {
            bugData.linkedTaskIds = [...new Set(bugData.linkedTaskIds.map(String))];
        }

        const newBug = new Bug({
            ...bugData,
            createdBy: userId,
            friendlyId
        });

        const bug = await newBug.save();

        // Handle linking if provided
        if (bugData.linkedTestCaseIds && bugData.linkedTestCaseIds.length > 0) {
            // Update test cases to include this bug
            await TestCase.updateMany(
                { _id: { $in: bugData.linkedTestCaseIds } },
                { $addToSet: { linkedBugIds: bug._id } }
            );
        }

        // Handle task linking if provided
        if (bugData.linkedTaskIds && bugData.linkedTaskIds.length > 0) {
            await Task.updateMany(
                { _id: { $in: bugData.linkedTaskIds } },
                { $addToSet: { links: { targetType: 'Bug', targetId: bug._id } } }
            );
        }

        res.json(bug);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updateBug = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const oldBug = await Bug.findById(id);

        // Ensure linked ids have no duplicates
        if (req.body.linkedTestCaseIds && Array.isArray(req.body.linkedTestCaseIds)) {
            req.body.linkedTestCaseIds = [...new Set(req.body.linkedTestCaseIds.map(String))];
        }
        if (req.body.linkedTaskIds && Array.isArray(req.body.linkedTaskIds)) {
            req.body.linkedTaskIds = [...new Set(req.body.linkedTaskIds.map(String))];
        }

        const bug = await Bug.findByIdAndUpdate(id, req.body, { new: true });

        // Handle case linking if linkedTestCaseIds is being updated
        if (req.body.linkedTestCaseIds) {
            // Get the old linked test cases
            const oldLinks = oldBug?.linkedTestCaseIds || [];
            const newLinks = req.body.linkedTestCaseIds;

            // Find added test cases (in new but not in old)
            const addedLinks = newLinks.filter((tcId: any) =>
                !oldLinks.some((oldId: any) => oldId.toString() === tcId.toString())
            );

            // Find removed test cases (in old but not in new)
            const removedLinks = oldLinks.filter((oldId: any) =>
                !newLinks.some((tcId: any) => tcId.toString() === oldId.toString())
            );

            // Update test cases: add this bug to newly linked test cases
            if (addedLinks.length > 0) {
                await TestCase.updateMany(
                    { _id: { $in: addedLinks } },
                    { $addToSet: { linkedBugIds: bug?._id } }
                );
            }

            // Update test cases: remove this bug from unlinked test cases
            if (removedLinks.length > 0) {
                await TestCase.updateMany(
                    { _id: { $in: removedLinks } },
                    { $pull: { linkedBugIds: bug?._id } }
                );
            }
        }

        // Handle task linking if linkedTaskIds is being updated
        if (req.body.linkedTaskIds) {
            const oldTaskLinks = oldBug?.linkedTaskIds || [];
            const newTaskLinks = req.body.linkedTaskIds;

            const addedTaskLinks = newTaskLinks.filter((taskId: any) =>
                !oldTaskLinks.some((oldId: any) => oldId.toString() === taskId.toString())
            );

            const removedTaskLinks = oldTaskLinks.filter((oldId: any) =>
                !newTaskLinks.some((taskId: any) => taskId.toString() === oldId.toString())
            );

            if (addedTaskLinks.length > 0) {
                await Task.updateMany(
                    { _id: { $in: addedTaskLinks } },
                    { $addToSet: { links: { targetType: 'Bug', targetId: id } } }
                );
            }

            if (removedTaskLinks.length > 0) {
                await Task.updateMany(
                    { _id: { $in: removedTaskLinks } },
                    { $pull: { links: { targetType: 'Bug', targetId: id } } }
                );
            }
        }

        if (bug && oldBug && bug.status !== oldBug.status) {
            // Status changed, notify both QA and DEV members
            const project = await Project.findById(bug.projectId);
            if (project) {
                const allMembers = project.members; // Notify all members
                const notifications = allMembers.map(member => ({
                    userId: String(member.userId || member._id), // Use userId or fallback to _id
                    type: 'bug_status_changed',
                    bugId: bug._id,
                    bugTitle: bug.title,
                    message: `Bug "${bug.title}" status changed to ${bug.status}`
                }));
                if (notifications.length > 0) {
                    await Notification.insertMany(notifications);
                }
            }
        }

        res.json(bug);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const deleteBug = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Bug.findByIdAndDelete(id);

        // Remove references from test cases and tasks
        await TestCase.updateMany(
            { linkedBugIds: id },
            { $pull: { linkedBugIds: id } }
        );
        await Task.updateMany(
            { 'links.targetType': 'Bug', 'links.targetId': id },
            { $pull: { links: { targetType: 'Bug', targetId: id } } }
        );

        res.json({ msg: 'Bug deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
