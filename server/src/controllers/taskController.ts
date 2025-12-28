import { Request, Response } from 'express';
import { Task } from '../models/Task';

export const getTasks = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is required' });
        }
        const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { projectId, title, description, status, priority, tags, additionalInfo, attachments } = req.body;
        const task = new Task({
            projectId,
            title,
            description,
            status,
            priority,
            tags,
            additionalInfo,
            attachments,
            createdBy: (req as any).user.id
        });
        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { title, description, status, priority, tags, additionalInfo, attachments } = req.body;
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

        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
