import express from 'express';
import {
    getProjects,
    createProject,
    updateProject,
    addTeamMember,
    removeTeamMember,
    updatePermissions,
    deleteProject
} from '../controllers/projectController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/', auth, getProjects);
router.post('/', auth, createProject);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);
router.post('/:id/members', auth, addTeamMember);
router.delete('/:id/members/:memberId', auth, removeTeamMember);
router.put('/:id/permissions', auth, updatePermissions);

export default router;
