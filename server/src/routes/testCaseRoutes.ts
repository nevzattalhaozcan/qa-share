import express from 'express';
import {
    getTestCases,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    duplicateTestCase,
    moveTestCase,
    bulkDuplicateTestCases,
    bulkMoveTestCases
} from '../controllers/testCaseController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getTestCases);
router.post('/', auth, createTestCase);

// Bulk operations (must come BEFORE :id routes)
router.post('/bulk/duplicate', auth, bulkDuplicateTestCases);
router.patch('/bulk/move', auth, bulkMoveTestCases);

// Single operations with :id
router.put('/:id', auth, updateTestCase);
router.delete('/:id', auth, deleteTestCase);
router.post('/:id/duplicate', auth, duplicateTestCase);
router.patch('/:id/move', auth, moveTestCase);

export default router;
