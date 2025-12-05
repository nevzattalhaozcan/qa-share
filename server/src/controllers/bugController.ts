import { Request, Response } from 'express';
import { Bug } from '../models/Bug';
import { TestCase } from '../models/TestCase';
import { Project } from '../models/Project';
import { Notification } from '../models/Notification';

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

        // Ensure linkedTestCaseIds has no duplicates
        if (bugData.linkedTestCaseIds && Array.isArray(bugData.linkedTestCaseIds)) {
            bugData.linkedTestCaseIds = [...new Set(bugData.linkedTestCaseIds.map(String))];
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

        // Notify Developers
        const project = await Project.findById(bug.projectId);
        if (project) {
            const devMembers = project.members.filter(m => m.role === 'DEV');
            const notifications = devMembers.map(dev => ({
                userId: String(dev.userId || dev._id), // Use userId or fallback to _id
                type: 'bug_created',
                bugId: bug._id,
                bugTitle: bug.title,
                message: `New bug created: ${bug.title}`
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
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
        
        // Ensure linkedTestCaseIds has no duplicates
        if (req.body.linkedTestCaseIds && Array.isArray(req.body.linkedTestCaseIds)) {
            req.body.linkedTestCaseIds = [...new Set(req.body.linkedTestCaseIds.map(String))];
        }
        
        const bug = await Bug.findByIdAndUpdate(id, req.body, { new: true });

        // Handle linking if linkedTestCaseIds is being updated
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

        // Remove references from test cases
        await TestCase.updateMany(
            { linkedBugIds: id },
            { $pull: { linkedBugIds: id } }
        );

        res.json({ msg: 'Bug deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
