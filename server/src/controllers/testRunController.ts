import { Request, Response } from 'express';
import { TestRun } from '../models/TestRun';
import { TestCase } from '../models/TestCase';

// Generate a unique run ID (e.g., RUN-001, RUN-002)
async function generateRunId(projectId: string): Promise<string> {
    const latestRun = await TestRun.findOne({ projectId })
        .sort({ createdAt: -1 })
        .select('runId');

    if (!latestRun) {
        return 'RUN-001';
    }

    const lastNumber = parseInt(latestRun.runId.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `RUN-${nextNumber.toString().padStart(3, '0')}`;
}

// Create a new test run
export const createTestRun = async (req: Request, res: Response) => {
    try {
        const { testCaseId, status } = req.body;
        const userId = (req as any).user.user.id;

        if (!testCaseId || !status) {
            return res.status(400).json({ message: 'testCaseId and status are required' });
        }

        if (status !== 'Pass' && status !== 'Fail') {
            return res.status(400).json({ message: 'Status must be Pass or Fail' });
        }

        // Get test case to retrieve projectId
        const testCase = await TestCase.findById(testCaseId);
        if (!testCase) {
            return res.status(404).json({ message: 'Test case not found' });
        }

        const runId = await generateRunId(testCase.projectId.toString());

        const testRun = new TestRun({
            runId,
            testCaseId,
            projectId: testCase.projectId,
            status,
            executedBy: userId,
            runDateTime: new Date(),
        });

        await testRun.save();

        // Populate executedBy field
        await testRun.populate('executedBy', 'name username');

        res.status(201).json(testRun);
    } catch (error) {
        console.error('Error creating test run:', error);
        res.status(500).json({ message: 'Failed to create test run' });
    }
};

// Get all runs for a test case
export const getTestRunsByTestCase = async (req: Request, res: Response) => {
    try {
        const { testCaseId } = req.params;

        const runs = await TestRun.find({ testCaseId })
            .sort({ runDateTime: -1 })
            .populate('executedBy', 'name username');

        res.json(runs);
    } catch (error) {
        console.error('Error fetching test runs:', error);
        res.status(500).json({ message: 'Failed to fetch test runs' });
    }
};

// Get latest run for a test case
export const getLatestTestRun = async (req: Request, res: Response) => {
    try {
        const { testCaseId } = req.params;

        const latestRun = await TestRun.findOne({ testCaseId })
            .sort({ runDateTime: -1 })
            .populate('executedBy', 'name username');

        res.json(latestRun);
    } catch (error) {
        console.error('Error fetching latest test run:', error);
        res.status(500).json({ message: 'Failed to fetch latest test run' });
    }
};

// Get latest runs for multiple test cases (batch request)
export const getLatestTestRuns = async (req: Request, res: Response) => {
    try {
        const { testCaseIds } = req.body;

        if (!Array.isArray(testCaseIds)) {
            return res.status(400).json({ message: 'testCaseIds must be an array' });
        }

        // Aggregate to get the latest run for each test case
        const latestRuns = await TestRun.aggregate([
            { $match: { testCaseId: { $in: testCaseIds.map((id: string) => id) } } },
            { $sort: { runDateTime: -1 } },
            {
                $group: {
                    _id: '$testCaseId',
                    latestRun: { $first: '$$ROOT' }
                }
            }
        ]);

        // Populate executedBy
        await TestRun.populate(latestRuns, {
            path: 'latestRun.executedBy',
            select: 'name username'
        });

        // Convert to a map for easier lookup
        const runsMap: { [key: string]: any } = {};
        latestRuns.forEach((item) => {
            runsMap[item._id.toString()] = item.latestRun;
        });

        res.json(runsMap);
    } catch (error) {
        console.error('Error fetching latest test runs:', error);
        res.status(500).json({ message: 'Failed to fetch latest test runs' });
    }
};
