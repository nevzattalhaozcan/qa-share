import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedDatabase } from './config/seedDatabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
const isProduction = process.env.NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI;
let databaseReady = false;

// CORS configuration
const corsOptions = {
    origin: (requestOrigin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!requestOrigin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.FRONTEND_URL,
            'https://nevzattalhaozcan.github.io'
        ].filter(Boolean) as string[];

        // Check if the request origin matches any of the allowed origins
        // We strip trailing slashes for comparison just in case
        const isAllowed = allowedOrigins.some(origin =>
            origin.replace(/\/$/, '') === requestOrigin.replace(/\/$/, '')
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS. Request Origin:', requestOrigin);
            console.log('Allowed Origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
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
import taskRoutes from './routes/taskRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tests', testCaseRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test-runs', testRunRoutes);
app.use('/api/tasks', taskRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('QA Share API is running');
});

// Health check endpoint for keep-alive ping
app.get('/api/health', (req, res) => {
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? 'ok' : 'degraded',
        databaseReady,
        timestamp: new Date().toISOString()
    });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    // Keep-alive: Self-ping every 14 minutes to prevent Render from spinning down
    if (isProduction && process.env.RENDER_EXTERNAL_URL) {
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

async function connectToMongo() {
    const mongoUri = MONGODB_URI || 'mongodb://localhost:27017/qa-share';

    if (isProduction && !MONGODB_URI) {
        console.error('MONGODB_URI is not set. Render deployment will stay up, but database-dependent routes will not work until it is configured.');
        return;
    }

    try {
        await mongoose.connect(mongoUri);
        databaseReady = true;
        console.log('Connected to MongoDB');

        // Seed database with default users
        await seedDatabase();
    } catch (err) {
        databaseReady = false;
        console.error('MongoDB connection error:', err);

        if (isProduction) {
            console.log('Retrying MongoDB connection in 5 seconds...');
            setTimeout(() => {
                void connectToMongo();
            }, 5000);
        }
    }
}

void connectToMongo();
