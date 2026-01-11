import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { Bug } from '../models/Bug';
import { TestCase } from '../models/TestCase';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is required' });
        }
        const tasks = await Task.find({ projectId }).sort({ order: 1, createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { projectId, title, description, status, priority, tags, additionalInfo, attachments, parentId, links, order, assignedTo } = req.body;
        const task = new Task({
            projectId,
            title,
            description,
            status,
            priority,
            tags,
            additionalInfo,
            attachments,
            parentId,
            links,
            order: order || 0,
            assignedTo,
            reporter: (req as any).user.id,
            createdBy: (req as any).user.id
        });
        await task.save();

        // Handle bi-directional linking
        if (links && links.length > 0) {
            const bugIds = links.filter((l: any) => l.targetType === 'Bug').map((l: any) => l.targetId);
            const testIds = links.filter((l: any) => l.targetType === 'TestCase').map((l: any) => l.targetId);

            if (bugIds.length > 0) {
                await Bug.updateMany({ _id: { $in: bugIds } }, { $addToSet: { linkedTaskIds: task._id } });
            }
            if (testIds.length > 0) {
                await TestCase.updateMany({ _id: { $in: testIds } }, { $addToSet: { linkedTaskIds: task._id } });
            }
        }

        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { title, description, status, priority, tags, additionalInfo, attachments, parentId, links, order, assignedTo } = req.body;
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        task.title = title || task.title;
        task.description = description || task.description;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.tags = tags || task.tags;
        task.additionalInfo = additionalInfo || task.additionalInfo;
        task.attachments = attachments || task.attachments;
        task.parentId = parentId !== undefined ? parentId : task.parentId;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;

        if (links) {
            const oldLinks = task.links || [];
            const newLinks = links;

            // Find added links
            const addedLinks = newLinks.filter((newLink: any) =>
                !oldLinks.some((oldLink: any) =>
                    oldLink.targetType === newLink.targetType &&
                    oldLink.targetId.toString() === newLink.targetId.toString()
                )
            );

            // Find removed links
            const removedLinks = oldLinks.filter((oldLink: any) =>
                !newLinks.some((newLink: any) =>
                    newLink.targetType === oldLink.targetType &&
                    newLink.targetId.toString() === oldLink.targetId.toString()
                )
            );

            // Update Bugs
            const addedBugs = addedLinks.filter((l: any) => l.targetType === 'Bug').map((l: any) => l.targetId);
            const removedBugs = removedLinks.filter((l: any) => l.targetType === 'Bug').map((l: any) => l.targetId);

            if (addedBugs.length > 0) {
                await Bug.updateMany({ _id: { $in: addedBugs } }, { $addToSet: { linkedTaskIds: task._id } });
            }
            if (removedBugs.length > 0) {
                await Bug.updateMany({ _id: { $in: removedBugs } }, { $pull: { linkedTaskIds: task._id } });
            }

            // Update TestCases
            const addedTests = addedLinks.filter((l: any) => l.targetType === 'TestCase').map((l: any) => l.targetId);
            const removedTests = removedLinks.filter((l: any) => l.targetType === 'TestCase').map((l: any) => l.targetId);

            if (addedTests.length > 0) {
                await TestCase.updateMany({ _id: { $in: addedTests } }, { $addToSet: { linkedTaskIds: task._id } });
            }
            if (removedTests.length > 0) {
                await TestCase.updateMany({ _id: { $in: removedTests } }, { $pull: { linkedTaskIds: task._id } });
            }
        }

        task.links = links || task.links;
        task.order = order !== undefined ? order : task.order;

        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task) {
            // Remove references from other tasks (subtasks)
            await Task.updateMany({ parentId: task._id }, { $unset: { parentId: 1 } });

            // Remove from bugs
            await Bug.updateMany({ linkedTaskIds: task._id }, { $pull: { linkedTaskIds: task._id } });

            // Remove from test cases
            await TestCase.updateMany({ linkedTaskIds: task._id }, { $pull: { linkedTaskIds: task._id } });

            await Task.findByIdAndDelete(req.params.id);
        }
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
