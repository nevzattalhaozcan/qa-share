import express from 'express';
import { auth } from '../middleware/auth';
import {
    createTestRun,
    getTestRunsByTestCase,
    getLatestTestRun,
    getLatestTestRuns,
} from '../controllers/testRunController';

const router = express.Router();

router.post('/', auth, createTestRun);
router.get('/test-case/:testCaseId', auth, getTestRunsByTestCase);
router.get('/test-case/:testCaseId/latest', auth, getLatestTestRun);
router.post('/latest-batch', auth, getLatestTestRuns);

export default router;
