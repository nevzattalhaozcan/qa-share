import express from 'express';
import { getBugs, createBug, updateBug, deleteBug } from '../controllers/bugController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getBugs);
router.post('/', auth, createBug);
router.put('/:id', auth, updateBug);
router.delete('/:id', auth, deleteBug);

export default router;
