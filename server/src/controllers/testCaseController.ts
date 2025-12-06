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

// Duplicate a single test case
export const duplicateTestCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { targetProjectId } = req.body;
        // @ts-ignore
        const userId = req.user.user.id;

        const originalTestCase = await TestCase.findById(id);
        if (!originalTestCase) {
            return res.status(404).json({ msg: 'Test case not found' });
        }

        const projectId = targetProjectId || originalTestCase.projectId;
        const friendlyId = await getNextFriendlyId(TestCase, 'TC');

        const duplicateData = {
            projectId,
            title: originalTestCase.title,
            description: originalTestCase.description,
            preconditions: originalTestCase.preconditions,
            steps: originalTestCase.steps,
            expectedResult: originalTestCase.expectedResult,
            priority: originalTestCase.priority,
            status: 'Draft', // Reset to draft
            tags: originalTestCase.tags,
            friendlyId,
            linkedBugIds: [], // Clear linked bugs
            createdBy: userId,
        };

        const newTestCase = new TestCase(duplicateData);
        await newTestCase.save();

        res.json(newTestCase);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Move a single test case to another project
export const moveTestCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { targetProjectId } = req.body;

        if (!targetProjectId) {
            return res.status(400).json({ msg: 'Target project ID is required' });
        }

        const testCase = await TestCase.findById(id);
        if (!testCase) {
            return res.status(404).json({ msg: 'Test case not found' });
        }

        const oldProjectId = testCase.projectId;

        // Remove links from bugs in old project
        if (testCase.linkedBugIds && testCase.linkedBugIds.length > 0) {
            await Bug.updateMany(
                { _id: { $in: testCase.linkedBugIds } },
                { $pull: { linkedTestCaseIds: testCase._id } }
            );
        }

        // Generate new friendly ID for new project
        const friendlyId = await getNextFriendlyId(TestCase, 'TC');

        // Update test case
        testCase.projectId = targetProjectId;
        testCase.friendlyId = friendlyId;
        testCase.linkedBugIds = []; // Clear linked bugs
        await testCase.save();

        res.json(testCase);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Bulk duplicate test cases
export const bulkDuplicateTestCases = async (req: Request, res: Response) => {
    try {
        const { testCaseIds, targetProjectId } = req.body;
        // @ts-ignore
        const userId = req.user.user.id;

        if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
            return res.status(400).json({ msg: 'Test case IDs are required' });
        }

        const originalTestCases = await TestCase.find({ _id: { $in: testCaseIds } });
        if (originalTestCases.length === 0) {
            return res.status(404).json({ msg: 'No test cases found' });
        }

        const duplicatedTestCases = [];

        for (const original of originalTestCases) {
            const projectId = targetProjectId || original.projectId;
            const friendlyId = await getNextFriendlyId(TestCase, 'TC');

            const duplicateData = {
                projectId,
                title: original.title,
                description: original.description,
                preconditions: original.preconditions,
                steps: original.steps,
                expectedResult: original.expectedResult,
                priority: original.priority,
                status: 'Draft',
                tags: original.tags,
                friendlyId,
                linkedBugIds: [],
                createdBy: userId,
            };

            const newTestCase = new TestCase(duplicateData);
            await newTestCase.save();
            duplicatedTestCases.push(newTestCase);
        }

        res.json(duplicatedTestCases);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Bulk move test cases
export const bulkMoveTestCases = async (req: Request, res: Response) => {
    try {
        const { testCaseIds, targetProjectId } = req.body;

        if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
            return res.status(400).json({ msg: 'Test case IDs are required' });
        }

        if (!targetProjectId) {
            return res.status(400).json({ msg: 'Target project ID is required' });
        }

        const testCases = await TestCase.find({ _id: { $in: testCaseIds } });
        if (testCases.length === 0) {
            return res.status(404).json({ msg: 'No test cases found' });
        }

        const movedTestCases = [];

        for (const testCase of testCases) {
            // Remove links from bugs in old project
            if (testCase.linkedBugIds && testCase.linkedBugIds.length > 0) {
                await Bug.updateMany(
                    { _id: { $in: testCase.linkedBugIds } },
                    { $pull: { linkedTestCaseIds: testCase._id } }
                );
            }

            // Generate new friendly ID
            const friendlyId = await getNextFriendlyId(TestCase, 'TC');

            testCase.projectId = targetProjectId;
            testCase.friendlyId = friendlyId;
            testCase.linkedBugIds = [];
            await testCase.save();
            movedTestCases.push(testCase);
        }

        res.json(movedTestCases);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
