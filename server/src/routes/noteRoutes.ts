import express from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/noteController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getNotes);
router.post('/', auth, createNote);
router.put('/:id', auth, updateNote);
router.delete('/:id', auth, deleteNote);

export default router;
