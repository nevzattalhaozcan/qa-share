import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.user.id;
        const { name, description, permissions } = req.body;

        // Fetch both demo users to add them as team members
        const qaUser = await User.findById('673ffa1234567890abcdef01');
        const devUser = await User.findById('673ffa1234567890abcdef02');

        const defaultMembers = [];
        if (qaUser) {
            defaultMembers.push({
                userId: qaUser._id,
                name: qaUser.name,
                username: qaUser.username,
                password: '', // Don't include password in project members
                role: qaUser.role
            });
        }
        if (devUser) {
            defaultMembers.push({
                userId: devUser._id,
                name: devUser.name,
                username: devUser.username,
                password: '', // Don't include password in project members
                role: devUser.role
            });
        }

        const newProject = new Project({
            name,
            description,
            createdBy: userId,
            permissions,
            members: defaultMembers,
        });

        // If frontend sends additional members, merge them
        if (req.body.members && Array.isArray(req.body.members)) {
            // Add any additional members from frontend, avoiding duplicates
            req.body.members.forEach((member: any) => {
                const exists = newProject.members.some(m =>
                    String(m._id) === String(member._id) || m.username === member.username
                );
                if (!exists) {
                    newProject.members.push(member);
                }
            });
        }

        const project = await newProject.save();
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const addTeamMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const member = req.body;

        // Check if user exists in User collection, if not create one
        let user = await User.findOne({ username: member.username });
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(member.password, salt);

            user = new User({
                name: member.name,
                username: member.username,
                password: hashedPassword,
                role: member.role
            });
            await user.save();
        }

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Check limits
        const qaCount = project.members.filter(m => m.role === 'QA').length;
        const devCount = project.members.filter(m => m.role === 'DEV').length;

        if (member.role === 'QA' && qaCount >= 3) {
            return res.status(400).json({ msg: 'Maximum 3 QAs allowed per project' });
        }
        if (member.role === 'DEV' && devCount >= 5) {
            return res.status(400).json({ msg: 'Maximum 5 Developers allowed per project' });
        }

        // Add member with the actual user's ID
        project.members.push({
            userId: user._id,
            name: member.name,
            username: member.username,
            password: member.password, // Store original password for display (not hashed)
            role: member.role
        });
        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const removeTeamMember = async (req: Request, res: Response) => {
    try {
        const { id, memberId } = req.params;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // @ts-ignore
        project.members.pull({ _id: memberId });
        await project.save();
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updatePermissions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        const project = await Project.findByIdAndUpdate(
            id,
            { permissions },
            { new: true }
        );
        res.json(project);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user.user.id;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Only the creator can delete the project
        if (project.createdBy.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to delete this project' });
        }

        await Project.findByIdAndDelete(id);
        res.json({ msg: 'Project deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
