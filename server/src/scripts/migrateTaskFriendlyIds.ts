// Migration script to backfill friendlyId for existing tasks
// Run this script once: npx ts-node server/src/scripts/migrateTaskFriendlyIds.ts

import mongoose from 'mongoose';
import { Task } from '../models/Task';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all tasks without friendlyId, sorted by createdAt
        const tasksWithoutFriendlyId = await Task.find({
            $or: [
                { friendlyId: { $exists: false } },
                { friendlyId: null },
                { friendlyId: '' }
            ]
        }).sort({ createdAt: 1 });

        console.log(`Found ${tasksWithoutFriendlyId.length} tasks without friendlyId`);

        if (tasksWithoutFriendlyId.length === 0) {
            console.log('No tasks to migrate');
            await mongoose.disconnect();
            return;
        }

        // Get the current highest friendlyId number
        const lastTaskWithId = await Task.findOne({ friendlyId: { $regex: '^TASK-' } }).sort({ createdAt: -1 });
        let lastIdNum = 0;
        if (lastTaskWithId && lastTaskWithId.friendlyId) {
            lastIdNum = parseInt(lastTaskWithId.friendlyId.split('-')[1]);
        }

        // Update each task
        for (const task of tasksWithoutFriendlyId) {
            lastIdNum++;
            const friendlyId = `TASK-${lastIdNum}`;
            await Task.updateOne({ _id: task._id }, { $set: { friendlyId } });
            console.log(`Updated task ${task._id} with friendlyId: ${friendlyId}`);
        }

        console.log('Migration complete!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
