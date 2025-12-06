import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedDatabase } from './config/seedDatabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || '*'
        : '*',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import testCaseRoutes from './routes/testCaseRoutes';
import bugRoutes from './routes/bugRoutes';
import commentRoutes from './routes/commentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import noteRoutes from './routes/noteRoutes';
import uploadRoutes from './routes/uploadRoutes';
import testRunRoutes from './routes/testRunRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tests', testCaseRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test-runs', testRunRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('QA Share API is running');
});

// Health check endpoint for keep-alive ping
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/qa-share';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        // Seed database with default users
        await seedDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);

            // Keep-alive: Self-ping every 14 minutes to prevent Render from spinning down
            if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
                const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

                setInterval(async () => {
                    try {
                        const response = await fetch(`${process.env.RENDER_EXTERNAL_URL}/api/health`);
                        console.log(`Keep-alive ping: ${response.status}`);
                    } catch (error) {
                        console.error('Keep-alive ping failed:', error);
                    }
                }, PING_INTERVAL);

                console.log('Keep-alive ping scheduled every 14 minutes');
            }
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
