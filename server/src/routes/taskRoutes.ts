import express from 'express';
import { auth } from '../middleware/auth';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController';

const router = express.Router();

router.get('/', auth, getTasks);
router.post('/', auth, createTask);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

export default router;
