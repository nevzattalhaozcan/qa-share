import { Request, Response } from 'express';
import { Comment } from '../models/Comment';
import { Bug } from '../models/Bug';
import { Project } from '../models/Project';
import { Notification } from '../models/Notification';
import { User } from '../models/User';

export const getComments = async (req: Request, res: Response) => {
    try {
        const { bugId } = req.params;
        const comments = await Comment.find({ bugId }).sort({ createdAt: 1 });
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const { bugId, content, parentId } = req.body;
        // @ts-ignore
        const user = req.user.user;

        // Fetch user details from database
        const userDoc = await User.findById(user.id);
        if (!userDoc) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const newComment = new Comment({
            bugId,
            userId: user.id,
            userName: userDoc.name,
            content,
            parentId
        });

        const comment = await newComment.save();

        // Notifications
        const bug = await Bug.findById(bugId);
        if (bug) {
            const project = await Project.findById(bug.projectId);
            if (project) {
                if (parentId) {
                    const parentComment = await Comment.findById(parentId);
                    if (parentComment && parentComment.userId !== user.id) {
                        const notification = new Notification({
                            userId: parentComment.userId,
                            type: 'comment_added',
                            bugId: bug._id,
                            bugTitle: bug.title,
                            message: `${userDoc.name} replied to your comment on "${bug.title}"`
                        });
                        await notification.save();
                    }
                } else {
                    // Notify both QA and DEV members (all team members)
                    const userRole = user.role;
                    const userId = user.id;

                    // Filter out the comment author to avoid self-notification
                    const targetMembers = project.members.filter(m => {
                        const memberId = String(m.userId || m._id);
                        return memberId !== String(userId);
                    });

                    const notifications = targetMembers.map(target => ({
                        userId: String(target.userId || target._id), // Use userId or fallback to _id
                        type: 'comment_added',
                        bugId: bug._id,
                        bugTitle: bug.title,
                        message: `${userDoc.name} commented on "${bug.title}"`
                    }));

                    if (notifications.length > 0) {
                        await Notification.insertMany(notifications);
                    }
                }
            }
        }

        res.json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const resolveComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const comment = await Comment.findByIdAndUpdate(id, { resolved: true }, { new: true });
        res.json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
