import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
    user?: any;
}

// Fixed ObjectIds for demo users (must match seedDatabase.ts)
const DEMO_QA_ID = '673ffa1234567890abcdef01';
const DEMO_DEV_ID = '673ffa1234567890abcdef02';

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Handle demo tokens
    if (token === 'demo-token-qa') {
        req.user = {
            user: {
                id: DEMO_QA_ID,
                role: 'QA'
            }
        };
        return next();
    }

    if (token === 'demo-token-dev') {
        req.user = {
            user: {
                id: DEMO_DEV_ID,
                role: 'DEV'
            }
        };
        return next();
    }

    // Handle regular JWT tokens (for existing login/register)
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
