import { Request, Response } from 'express';
import multer from 'multer';
import { cloudinary } from '../config/firebase';
import { Readable } from 'stream';

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images, videos, and common document types
        const allowedMimeTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            // Videos
            'video/mp4', 'video/webm', 'video/quicktime',
            // Documents
            'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only images, videos, and documents are allowed'));
    }
});

// Upload file to Cloudinary
export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const file = req.file;

        // Upload to Cloudinary using stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'qa-share/attachments',
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) {
                    console.error('Upload error:', error);
                    return res.status(500).json({ error: 'Failed to upload file' });
                }

                res.status(200).json({
                    message: 'File uploaded successfully',
                    url: result?.secure_url,
                    fileName: file.originalname,
                    publicId: result?.public_id
                });
            }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const bufferStream = Readable.from(file.buffer);
        bufferStream.pipe(uploadStream);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

// Delete file from Cloudinary
export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { fileUrl } = req.body;
        
        if (!fileUrl) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        // Extract public_id from Cloudinary URL
        const urlParts = fileUrl.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = `qa-share/attachments/${fileWithExt.split('.')[0]}`;

        await cloudinary.uploader.destroy(publicId);
        
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
};

export { upload };
