import { Request, Response } from 'express';
import { TestCase } from '../models/TestCase';
import { Bug } from '../models/Bug';
import { TestRun } from '../models/TestRun';
import { Task } from '../models/Task';

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

        // Ensure linked ids have no duplicates
        if (testCaseData.linkedBugIds && Array.isArray(testCaseData.linkedBugIds)) {
            testCaseData.linkedBugIds = [...new Set(testCaseData.linkedBugIds.map(String))];
        }
        if (testCaseData.linkedTaskIds && Array.isArray(testCaseData.linkedTaskIds)) {
            testCaseData.linkedTaskIds = [...new Set(testCaseData.linkedTaskIds.map(String))];
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

        // Handle task linking if provided
        if (testCaseData.linkedTaskIds && testCaseData.linkedTaskIds.length > 0) {
            await Task.updateMany(
                { _id: { $in: testCaseData.linkedTaskIds } },
                { $addToSet: { links: { targetType: 'TestCase', targetId: testCase._id } } }
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

        // Ensure linked ids have no duplicates
        if (req.body.linkedBugIds && Array.isArray(req.body.linkedBugIds)) {
            req.body.linkedBugIds = [...new Set(req.body.linkedBugIds.map(String))];
        }
        if (req.body.linkedTaskIds && Array.isArray(req.body.linkedTaskIds)) {
            req.body.linkedTaskIds = [...new Set(req.body.linkedTaskIds.map(String))];
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

        // Handle task linking if linkedTaskIds is being updated
        if (req.body.linkedTaskIds) {
            const oldTaskLinks = oldTestCase?.linkedTaskIds || [];
            const newTaskLinks = req.body.linkedTaskIds;

            const addedTaskLinks = newTaskLinks.filter((taskId: any) =>
                !oldTaskLinks.some((oldId: any) => oldId.toString() === taskId.toString())
            );

            const removedTaskLinks = oldTaskLinks.filter((oldId: any) =>
                !newTaskLinks.some((taskId: any) => taskId.toString() === oldId.toString())
            );

            if (addedTaskLinks.length > 0) {
                await Task.updateMany(
                    { _id: { $in: addedTaskLinks } },
                    { $addToSet: { links: { targetType: 'TestCase', targetId: id } } }
                );
            }

            if (removedTaskLinks.length > 0) {
                await Task.updateMany(
                    { _id: { $in: removedTaskLinks } },
                    { $pull: { links: { targetType: 'TestCase', targetId: id } } }
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

        // Remove references from bugs and tasks
        await Bug.updateMany(
            { linkedTestCaseIds: id },
            { $pull: { linkedTestCaseIds: id } }
        );
        await Task.updateMany(
            { 'links.targetType': 'TestCase', 'links.targetId': id },
            { $pull: { links: { targetType: 'TestCase', targetId: id } } }
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

        // Get the last friendly ID once to start the sequence
        const lastItem = await TestCase.findOne({ friendlyId: { $regex: '^TC-' } }).sort({ createdAt: -1 });
        let lastIdNum = 0;
        if (lastItem && lastItem.friendlyId) {
            lastIdNum = parseInt(lastItem.friendlyId.split('-')[1]);
        }

        const newTestCasesData = [];

        for (let i = 0; i < originalTestCases.length; i++) {
            const original = originalTestCases[i];
            const projectId = targetProjectId || original.projectId;

            lastIdNum++;
            const friendlyId = `TC-${lastIdNum}`;

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
            newTestCasesData.push(duplicateData);
        }

        const newTestCases = await TestCase.insertMany(newTestCasesData);
        res.json(newTestCases);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Create multiple test cases in bulk (API only)
export const createTestCasesBulk = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.user.id;
        const testCasesData = req.body;

        if (!Array.isArray(testCasesData) || testCasesData.length === 0) {
            return res.status(400).json({ msg: 'Request body must be a non-empty array of test cases' });
        }

        // Get the last friendly ID once to start the sequence
        const lastItem = await TestCase.findOne({ friendlyId: { $regex: '^TC-' } }).sort({ createdAt: -1 });
        let lastIdNum = 0;
        if (lastItem && lastItem.friendlyId) {
            lastIdNum = parseInt(lastItem.friendlyId.split('-')[1]);
        }

        const testCasesToInsert = testCasesData.map((data: any) => {
            lastIdNum++;
            const friendlyId = `TC-${lastIdNum}`;

            // Ensure linkedBugIds is unique if present
            let linkedBugIds: string[] = [];
            if (data.linkedBugIds && Array.isArray(data.linkedBugIds)) {
                linkedBugIds = [...new Set(data.linkedBugIds.map((id: any) => String(id)))] as string[];
            }

            return {
                ...data,
                createdBy: userId,
                friendlyId,
                linkedBugIds
            };
        });

        const newTestCases = await TestCase.insertMany(testCasesToInsert);

        // Handle linking for each created test case
        // This effectively links bugs to the new test cases in bulk
        const bulkOps = [];
        for (const testCase of newTestCases) {
            if (testCase.linkedBugIds && testCase.linkedBugIds.length > 0) {
                bulkOps.push({
                    updateMany: {
                        filter: { _id: { $in: testCase.linkedBugIds } },
                        update: { $addToSet: { linkedTestCaseIds: testCase._id } }
                    }
                });
            }
        }

        if (bulkOps.length > 0) {
            await Bug.bulkWrite(bulkOps);
        }

        res.json(newTestCases);
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

// Bulk delete test cases
export const bulkDeleteTestCases = async (req: Request, res: Response) => {
    try {
        const { testCaseIds } = req.body;

        if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
            return res.status(400).json({ msg: 'Test case IDs are required' });
        }

        // Delete test cases
        await TestCase.deleteMany({ _id: { $in: testCaseIds } });

        // Remove references from bugs and tasks
        await Bug.updateMany(
            { linkedTestCaseIds: { $in: testCaseIds } },
            { $pull: { linkedTestCaseIds: { $in: testCaseIds } } }
        );
        await Task.updateMany(
            { 'links.targetType': 'TestCase', 'links.targetId': { $in: testCaseIds } },
            { $pull: { links: { targetType: 'TestCase', targetId: { $in: testCaseIds } } } }
        );

        res.json({ msg: 'Test Cases deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
