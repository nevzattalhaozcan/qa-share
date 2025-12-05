import express from 'express';
import { uploadFile, deleteFile, upload } from '../controllers/uploadController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Upload file
router.post('/upload', auth, upload.single('file'), uploadFile);

// Delete file
router.delete('/delete', auth, deleteFile);

export default router;
