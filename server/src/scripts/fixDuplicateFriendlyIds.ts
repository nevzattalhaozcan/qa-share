// Migration script to fix duplicate friendlyIds for test cases
// Run this script once: npx ts-node server/src/scripts/fixDuplicateFriendlyIds.ts

import mongoose from 'mongoose';
import { TestCase } from '../models/TestCase';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qa-share';

async function fixDuplicates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all test cases with friendlyIds
        const allTestCases = await TestCase.find({ friendlyId: { $exists: true, $ne: null } }).sort({ createdAt: 1 });

        console.log(`Found ${allTestCases.length} test cases with friendlyIds`);

        // Find duplicates
        const idCounts: { [key: string]: any[] } = {};
        for (const tc of allTestCases) {
            const fid = tc.friendlyId;
            if (fid) {
                if (!idCounts[fid]) {
                    idCounts[fid] = [];
                }
                idCounts[fid].push(tc);
            }
        }

        const duplicates = Object.entries(idCounts).filter(([_, items]) => items.length > 1);
        console.log(`Found ${duplicates.length} duplicate friendlyId groups`);

        if (duplicates.length === 0) {
            console.log('No duplicates to fix');
            await mongoose.disconnect();
            return;
        }

        // Find the current max ID number
        let maxNum = 0;
        for (const tc of allTestCases) {
            if (tc.friendlyId) {
                const match = tc.friendlyId.match(/^TC-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNum) maxNum = num;
                }
            }
        }
        console.log(`Current max ID number: ${maxNum}`);

        // Fix duplicates - keep the first (oldest) one, reassign the rest
        for (const [friendlyId, items] of duplicates) {
            console.log(`Fixing duplicate: ${friendlyId} (${items.length} items)`);

            // Skip the first item (keep its ID), update the rest
            for (let i = 1; i < items.length; i++) {
                maxNum++;
                const newId = `TC-${maxNum}`;
                await TestCase.updateOne({ _id: items[i]._id }, { $set: { friendlyId: newId } });
                console.log(`  Updated ${items[i]._id} from ${friendlyId} to ${newId}`);
            }
        }

        console.log('Duplicate fix complete!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

fixDuplicates();
