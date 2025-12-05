import express from 'express';
import { getTestCases, createTestCase, updateTestCase, deleteTestCase } from '../controllers/testCaseController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getTestCases);
router.post('/', auth, createTestCase);
router.put('/:id', auth, updateTestCase);
router.delete('/:id', auth, deleteTestCase);

export default router;
