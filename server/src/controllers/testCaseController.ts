import { Request, Response } from 'express';
import { TestCase } from '../models/TestCase';
import { Bug } from '../models/Bug';
import { TestRun } from '../models/TestRun';

// Helper to generate friendly ID
const getNextFriendlyId = async (model: any, prefix: string) => {
    const lastItem = await model.findOne({ friendlyId: { $regex: `^${prefix}-` } }).sort({ createdAt: -1 });
    if (!lastItem || !lastItem.friendlyId) return `${prefix}-1`;
    const lastIdNum = parseInt(lastItem.friendlyId.split('-')[1]);
    return `${prefix}-${lastIdNum + 1}`;
};

// Helper to generate run ID
const generateRunId = async (projectId: string): Promise<string> => {
    const latestRun = await TestRun.findOne({ projectId })
        .sort({ createdAt: -1 })
        .select('runId');
    
    if (!latestRun) {
        return 'RUN-001';
    }
    
    const lastNumber = parseInt(latestRun.runId.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `RUN-${nextNumber.toString().padStart(3, '0')}`;
};

export const getTestCases = async (req: Request, res: Response) => {
    try {
        const testCases = await TestCase.find().sort({ createdAt: -1 });
        res.json(testCases);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const createTestCase = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.user.id;
        const testCaseData = req.body;

        const friendlyId = await getNextFriendlyId(TestCase, 'TC');

        // Ensure linkedBugIds has no duplicates
        if (testCaseData.linkedBugIds && Array.isArray(testCaseData.linkedBugIds)) {
            testCaseData.linkedBugIds = [...new Set(testCaseData.linkedBugIds.map(String))];
        }

        const newTestCase = new TestCase({
            ...testCaseData,
            createdBy: userId,
            friendlyId
        });

        const testCase = await newTestCase.save();

        // Handle linking if provided
        if (testCaseData.linkedBugIds && testCaseData.linkedBugIds.length > 0) {
            // Update bugs to include this test case
            await Bug.updateMany(
                { _id: { $in: testCaseData.linkedBugIds } },
                { $addToSet: { linkedTestCaseIds: testCase._id } }
            );
        }

        res.json(testCase);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const updateTestCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const oldTestCase = await TestCase.findById(id);
        // @ts-ignore
        const userId = req.user.user.id;
        
        // Ensure linkedBugIds has no duplicates
        if (req.body.linkedBugIds && Array.isArray(req.body.linkedBugIds)) {
            req.body.linkedBugIds = [...new Set(req.body.linkedBugIds.map(String))];
        }
        
        // Check if status is changing to Pass or Fail
        const oldStatus = oldTestCase?.status;
        const newStatus = req.body.status;
        const shouldCreateRun = (newStatus === 'Pass' || newStatus === 'Fail') && 
                                oldStatus !== newStatus;
        
        const testCase = await TestCase.findByIdAndUpdate(id, req.body, { new: true });

        // Create test run if status changed to Pass or Fail
        if (shouldCreateRun && testCase) {
            const runId = await generateRunId(testCase.projectId.toString());
            
            const testRun = new TestRun({
                runId,
                testCaseId: testCase._id,
                projectId: testCase.projectId,
                status: newStatus,
                executedBy: userId,
                runDateTime: new Date(),
            });
            
            await testRun.save();
        }

        // Handle linking if linkedBugIds is being updated
        if (req.body.linkedBugIds) {
            // Get the old linked bugs
            const oldLinks = oldTestCase?.linkedBugIds || [];
            const newLinks = req.body.linkedBugIds;

            // Find added bugs (in new but not in old)
            const addedLinks = newLinks.filter((bugId: any) => 
                !oldLinks.some((oldId: any) => oldId.toString() === bugId.toString())
            );

            // Find removed bugs (in old but not in new)
            const removedLinks = oldLinks.filter((oldId: any) => 
                !newLinks.some((bugId: any) => bugId.toString() === oldId.toString())
            );

            // Update bugs: add this test case to newly linked bugs
            if (addedLinks.length > 0) {
                await Bug.updateMany(
                    { _id: { $in: addedLinks } },
                    { $addToSet: { linkedTestCaseIds: testCase?._id } }
                );
            }

            // Update bugs: remove this test case from unlinked bugs
            if (removedLinks.length > 0) {
                await Bug.updateMany(
                    { _id: { $in: removedLinks } },
                    { $pull: { linkedTestCaseIds: testCase?._id } }
                );
            }
        }

        res.json(testCase);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

export const deleteTestCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await TestCase.findByIdAndDelete(id);

        // Remove references from bugs
        await Bug.updateMany(
            { linkedTestCaseIds: id },
            { $pull: { linkedTestCaseIds: id } }
        );

        res.json({ msg: 'Test Case deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
