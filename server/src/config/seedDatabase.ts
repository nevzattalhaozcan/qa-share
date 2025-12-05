import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { TestCase } from '../models/TestCase';
import { Bug } from '../models/Bug';
import { Comment } from '../models/Comment';
import { Notification } from '../models/Notification';
import { Note } from '../models/Note';

export async function seedDatabase() {
    try {
        // Check if users already exist
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0) {
            console.log('Database already seeded. Skipping...');
            return;
        }

        console.log('Seeding database with default users...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('demo123', salt);

        const qaUser = new User({
            _id: new mongoose.Types.ObjectId('673ffa1234567890abcdef01'), // Fixed ID for consistency
            name: 'Demo QA User',
            username: 'qa-demo',
            password: hashedPassword,
            role: 'QA'
        });

        const devUser = new User({
            _id: new mongoose.Types.ObjectId('673ffa1234567890abcdef02'), // Fixed ID for consistency
            name: 'Demo Developer',
            username: 'dev-demo',
            password: hashedPassword,
            role: 'DEV'
        });

        await qaUser.save();
        await devUser.save();

        console.log('Default users created:');
        console.log('  - QA User: qa-demo / demo123');
        console.log('  - Dev User: dev-demo / demo123');
        console.log('Database seeding completed successfully!');

        return { qaUser, devUser };
    } catch (err) {
        console.error('Error seeding database:', err);
        throw err;
    }
}
