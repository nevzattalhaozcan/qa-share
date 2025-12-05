import express from 'express';
import { getNotes, createNote, deleteNote } from '../controllers/noteController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getNotes);
router.post('/', auth, createNote);
router.delete('/:id', auth, deleteNote);

export default router;
