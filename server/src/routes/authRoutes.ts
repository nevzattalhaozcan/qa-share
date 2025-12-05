import express from 'express';
import { register, login, updatePassword, updateProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/password', auth, updatePassword);
router.put('/profile', auth, updateProfile);

export default router;
