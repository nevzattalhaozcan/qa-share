import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export type UserRole = 'QA' | 'DEV' | null;

interface User {
    id: string;
    name: string;
    username: string;
    password: string;
    role: UserRole;
    avatar: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    register: (name: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    quickLogin: (role: 'QA' | 'DEV') => void;
    createPreference: 'test' | 'bug' | 'both';
    updateCreatePreference: (pref: 'test' | 'bug' | 'both') => void;
    updatePassword: (current: string, newPass: string) => Promise<boolean>;
    updateProfile: (name: string, username: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [createPreference, setCreatePreference] = useState<'test' | 'bug' | 'both'>('both');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Optionally, verify token or fetch user data from API
            // For now, we'll assume if token exists, user might be logged in
            // A more robust solution would involve a /me endpoint or token verification
            const storedUser = localStorage.getItem('qa-share-user'); // Keep this for initial user data if needed
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }

        const storedPref = localStorage.getItem('qa-share-preference');
        if (storedPref) {
            setCreatePreference(storedPref as any);
        }

        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            // Store user data received from the API
            localStorage.setItem('qa-share-user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const register = async (name: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await api.post('/auth/register', { name, username, password, role: 'QA' });
            localStorage.setItem('token', res.data.token);
            // Store user data received from the API
            localStorage.setItem('qa-share-user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return { success: true };
        } catch (err: any) {
            console.error(err);
            return { success: false, error: err.response?.data?.msg || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('qa-share-user');
        setUser(null);
    };

    const quickLogin = (role: 'QA' | 'DEV') => {
        const demoUser: User = {
            id: role === 'QA' ? '673ffa1234567890abcdef01' : '673ffa1234567890abcdef02',
            name: role === 'QA' ? 'Demo QA User' : 'Demo Developer',
            username: role === 'QA' ? 'qa-demo' : 'dev-demo',
            password: '',
            role: role,
            avatar: ''
        };
        localStorage.setItem('token', 'demo-token-' + role.toLowerCase());
        localStorage.setItem('qa-share-user', JSON.stringify(demoUser));
        setUser(demoUser);
    };

    const updateCreatePreference = (pref: 'test' | 'bug' | 'both') => {
        setCreatePreference(pref);
        localStorage.setItem('qa-share-preference', pref);
    };

    const updatePassword = async (current: string, newPass: string): Promise<boolean> => {
        try {
            await api.put('/auth/password', { currentPassword: current, newPassword: newPass });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const updateProfile = async (name: string, username: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const res = await api.put('/auth/profile', { name, username });
            const updatedUser = { ...user, ...res.data.user };
            setUser(updatedUser);
            localStorage.setItem('qa-share-user', JSON.stringify(updatedUser));
            return { success: true };
        } catch (err: any) {
            console.error(err);
            return { success: false, error: err.response?.data?.message || 'Failed to update profile' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, quickLogin, createPreference, updateCreatePreference, updatePassword, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
