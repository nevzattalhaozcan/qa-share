import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.user.id;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
        res.json(notification);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const clearNotifications = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.user.id;
        await Notification.deleteMany({ userId });
        res.json({ msg: 'Notifications cleared' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
