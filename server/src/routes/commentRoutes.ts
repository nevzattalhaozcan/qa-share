import express from 'express';
import { getComments, createComment, resolveComment } from '../controllers/commentController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/:bugId', auth, getComments);
router.post('/', auth, createComment);
router.put('/:id/resolve', auth, resolveComment);

export default router;
