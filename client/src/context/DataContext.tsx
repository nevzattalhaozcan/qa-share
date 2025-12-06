import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface TeamMember {
    id: string;
    name: string;
    username: string;
    password: string;
    role: 'QA' | 'DEV';
}

export interface ProjectPermissions {
    devCanViewTestCases: boolean;
    devCanCreateTestCases: boolean;
    devCanEditTestCases: boolean;
    devCanViewBugs: boolean;
    devCanCreateBugs: boolean;
    devCanEditBugs: boolean;
    devCanEditBugStatusOnly: boolean;
    devCanViewNotes: boolean;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdBy: string; // User ID
    members: TeamMember[];
    permissions: ProjectPermissions;
    createdAt: string;
}

export interface TestCase {
    id: string;
    projectId: string;
    title: string;
    description: string;
    preconditions?: string;
    steps: string;
    expectedResult: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Draft' | 'Todo' | 'In Progress' | 'Pass' | 'Fail';
    tags?: string[];
    createdAt: string;
    createdBy: string;
    friendlyId?: string;
    linkedBugIds?: string[];
}

export interface Bug {
    id: string;
    projectId: string;
    title: string;
    description: string;
    stepsToReproduce: string;
    expectedResult?: string;
    actualResult?: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Draft' | 'Opened' | 'Fixed' | 'Closed';
    tags?: string[];
    linkedTestCaseIds?: string[];
    attachments: string[]; // URLs
    createdAt: string;
    createdBy: string;
    friendlyId?: string;
}

export interface Note {
    id: string;
    projectId: string;
    type: 'simple' | 'kv';
    label?: string; // Key for KV
    content: string; // Value or Simple text
    pinned?: boolean;
    hidden?: boolean;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string; // Who should receive this notification
    type: 'bug_created' | 'bug_status_changed' | 'comment_added';
    bugId: string;
    bugTitle: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface Comment {
    id: string;
    bugId: string;
    userId: string;
    userName: string;
    content: string;
    parentId?: string; // For replies
    resolved: boolean;
    createdAt: string;
}

interface DataContextType {
    projects: Project[];
    testCases: TestCase[];
    bugs: Bug[];
    notes: Note[];
    notifications: Notification[];
    comments: Comment[];
    activeProjectId: string | null;
    isLoading: boolean;
    setActiveProjectId: (id: string | null) => void;
    addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
    deleteProject: (projectId: string) => void;
    updateProjectPermissions: (projectId: string, permissions: ProjectPermissions) => void;
    addTeamMember: (projectId: string, member: TeamMember) => Promise<string | null>;
    removeTeamMember: (projectId: string, memberId: string) => void;
    addTestCase: (testCase: Omit<TestCase, 'id' | 'createdAt' | 'createdBy'>) => Promise<TestCase | null>;
    updateTestCase: (id: string, updates: Partial<Omit<TestCase, 'id' | 'createdAt' | 'createdBy'>>) => void;
    addBug: (bug: Omit<Bug, 'id' | 'createdAt' | 'createdBy'>) => Promise<Bug | null>;
    updateBug: (id: string, updates: Partial<Omit<Bug, 'id' | 'createdAt' | 'createdBy'>>) => void;
    deleteTestCase: (id: string) => void;
    deleteBug: (id: string) => void;
    updateBugStatus: (id: string, status: Bug['status']) => void;
    updateTestCaseStatus: (id: string, status: TestCase['status']) => void;
    addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
    updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
    deleteNote: (id: string) => void;
    linkItems: (type1: 'test' | 'bug', id1: string, type2: 'test' | 'bug', id2: string) => void;
    unlinkItems: (type1: 'test' | 'bug', id1: string, type2: 'test' | 'bug', id2: string) => void;
    addNotification: () => void;
    markNotificationAsRead: (id: string) => void;
    clearAllNotifications: () => void;
    addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'resolved'>) => void;
    markCommentAsResolved: (id: string) => void;
    refetchData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [bugs, setBugs] = useState<Bug[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
        return localStorage.getItem('activeProjectId');
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [projectsRes, testsRes, bugsRes, notificationsRes] = await Promise.all([
                api.get('/projects'),
                api.get('/tests'),
                api.get('/bugs'),
                api.get('/notifications'),
            ]);

            setProjects(projectsRes.data);
            setTestCases(testsRes.data);
            setBugs(bugsRes.data);
            setNotifications(notificationsRes.data);

            // Active Project - only set if not already set from localStorage
            const storedProjectId = localStorage.getItem('activeProjectId');
            if (projectsRes.data.length > 0 && !storedProjectId) {
                const firstProjectId = projectsRes.data[0]._id || projectsRes.data[0].id;
                setActiveProjectId(firstProjectId);
                localStorage.setItem('activeProjectId', firstProjectId);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchData();
        }
    }, []);

    // Fetch notes when active project changes
    useEffect(() => {
        const fetchProjectNotes = async () => {
            if (activeProjectId) {
                try {
                    const res = await api.get(`/notes?projectId=${activeProjectId}`);
                    setNotes(res.data);
                } catch (err) {
                    console.error('Error fetching notes:', err);
                }
            } else {
                setNotes([]);
            }
        };

        fetchProjectNotes();
    }, [activeProjectId]);

    // We don't need save* functions anymore, we call API directly in add/update functions

    const handleSetActiveProjectId = (id: string | null) => {
        setActiveProjectId(id);
        if (id) {
            localStorage.setItem('activeProjectId', id);
        } else {
            localStorage.removeItem('activeProjectId');
        }
    };

    const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
        try {
            const res = await api.post('/projects', project);
            setProjects([res.data, ...projects]);
            setActiveProjectId(res.data._id || res.data.id);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteProject = async (projectId: string) => {
        try {
            await api.delete(`/projects/${projectId}`);
            setProjects(projects.filter(p => {
                const pId = (p as any)._id || p.id;
                return pId !== projectId;
            }));
            // If the deleted project was active, clear it
            if (activeProjectId === projectId) {
                setActiveProjectId(null);
                localStorage.removeItem('activeProjectId');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateProjectPermissions = async (projectId: string, permissions: ProjectPermissions) => {
        try {
            const res = await api.put(`/projects/${projectId}/permissions`, { permissions });
            setProjects(projects.map(p => (p.id === projectId || (p as any)._id === projectId) ? res.data : p));
        } catch (err) {
            console.error(err);
        }
    };

    const addTeamMember = async (projectId: string, member: TeamMember): Promise<string | null> => {
        try {
            const res = await api.post(`/projects/${projectId}/members`, member);
            setProjects(projects.map(p => (p.id === projectId || (p as any)._id === projectId) ? res.data : p));
            return null;
        } catch (err) {
            console.error(err);
            const errorMessage = (err as any).response?.data?.msg || (err as any).message || 'Failed to add member';
            return errorMessage;
        }
    };

    const removeTeamMember = async (projectId: string, memberId: string) => {
        try {
            const res = await api.delete(`/projects/${projectId}/members/${memberId}`);
            setProjects(projects.map(p => (p.id === projectId || (p as any)._id === projectId) ? res.data : p));
        } catch (err) {
            console.error(err);
        }
    };

    const addTestCase = async (testCase: Omit<TestCase, 'id' | 'createdAt' | 'createdBy'>) => {
        try {
            const res = await api.post('/tests', testCase);
            setTestCases([res.data, ...testCases]);
            return res.data;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const addBug = async (bug: Omit<Bug, 'id' | 'createdAt' | 'createdBy'>) => {
        try {
            const res = await api.post('/bugs', bug);
            setBugs([res.data, ...bugs]);
            return res.data;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const updateBugStatus = async (id: string, status: Bug['status']) => {
        try {
            const res = await api.put(`/bugs/${id}`, { status });
            setBugs(bugs.map(b => (b.id === id || (b as any)._id === id) ? res.data : b));
        } catch (err) {
            console.error(err);
        }
    };

    const updateTestCaseStatus = async (id: string, status: TestCase['status']) => {
        try {
            const res = await api.put(`/tests/${id}`, { status });
            setTestCases(testCases.map(t => (t.id === id || (t as any)._id === id) ? res.data : t));
        } catch (err) {
            console.error(err);
        }
    };

    const linkItems = async (type1: 'test' | 'bug', id1: string, type2: 'test' | 'bug', id2: string) => {
        try {
            if (type1 === 'test' && type2 === 'bug') {
                const testCase = testCases.find(t => t.id === id1 || (t as any)._id === id1);
                if (testCase) {
                    // Check if link already exists
                    const alreadyLinked = testCase.linkedBugIds?.some(linkedId =>
                        String(linkedId) === String(id2)
                    );
                    if (alreadyLinked) {
                        console.log('Already linked, skipping');
                        return;
                    }

                    const newLinks = [...(testCase.linkedBugIds || []), id2];
                    const res = await api.put(`/tests/${id1}`, { linkedBugIds: newLinks });
                    setTestCases(testCases.map(t => (t.id === id1 || (t as any)._id === id1) ? res.data : t));

                    // Also update local bug state to reflect the link immediately
                    setBugs(bugs.map(b => {
                        if (b.id === id2 || (b as any)._id === id2) {
                            const alreadyHasLink = b.linkedTestCaseIds?.some(linkedId =>
                                String(linkedId) === String(id1)
                            );
                            if (!alreadyHasLink) {
                                return { ...b, linkedTestCaseIds: [...(b.linkedTestCaseIds || []), id1] };
                            }
                        }
                        return b;
                    }));
                }
            } else if (type1 === 'bug' && type2 === 'test') {
                linkItems('test', id2, 'bug', id1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const unlinkItems = async (type1: 'test' | 'bug', id1: string, type2: 'test' | 'bug', id2: string) => {
        try {
            if (type1 === 'test' && type2 === 'bug') {
                const testCase = testCases.find(t => t.id === id1 || (t as any)._id === id1);
                if (testCase) {
                    const newLinks = (testCase.linkedBugIds || []).filter(linkedId =>
                        String(linkedId) !== String(id2)
                    );
                    const res = await api.put(`/tests/${id1}`, { linkedBugIds: newLinks });
                    setTestCases(testCases.map(t => (t.id === id1 || (t as any)._id === id1) ? res.data : t));

                    // Also update local bug state
                    setBugs(bugs.map(b => {
                        if (b.id === id2 || (b as any)._id === id2) {
                            const newBugLinks = (b.linkedTestCaseIds || []).filter(linkedId =>
                                String(linkedId) !== String(id1)
                            );
                            return { ...b, linkedTestCaseIds: newBugLinks };
                        }
                        return b;
                    }));
                }
            } else if (type1 === 'bug' && type2 === 'test') {
                unlinkItems('test', id2, 'bug', id1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const addNote = async (note: Omit<Note, 'id' | 'createdAt'>) => {
        try {
            const res = await api.post('/notes', note);
            setNotes([res.data, ...notes]);
        } catch (err) {
            console.error(err);
        }
    };

    const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => {
        try {
            const res = await api.put(`/notes/${id}`, updates);
            setNotes(notes.map(n => ((n as any)._id || n.id) === id ? res.data : n));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNote = async (id: string) => {
        try {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter(n => n.id !== id && (n as any)._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const addNotification = async () => {
        // Notifications are mostly server-generated now. 
        // But if we need client-side generation (e.g. for testing), we can't easily do it without an endpoint.
        // We didn't create a POST /notifications endpoint.
        // So this might be a no-op or we rely on server side logic.
        // For now, let's just update local state for immediate feedback if needed, but it won't persist.
        // Actually, we should probably remove this from Context if it's not used by client directly.
        // But existing code might call it.
        console.warn('addNotification is now handled by server');
    };

    const markNotificationAsRead = async (id: string) => {
        try {
            const res = await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => (n.id === id || (n as any)._id === id) ? res.data : n));
        } catch (err) {
            console.error(err);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await api.delete('/notifications');
            setNotifications([]);
        } catch (err) {
            console.error(err);
        }
    };

    const addComment = async (comment: Omit<Comment, 'id' | 'createdAt' | 'resolved'>) => {
        try {
            const res = await api.post('/comments', comment);
            setComments([...comments, res.data]);
        } catch (err) {
            console.error(err);
        }
    };

    const markCommentAsResolved = async (id: string) => {
        try {
            const res = await api.put(`/comments/${id}/resolve`);
            setComments(comments.map(c => (c.id === id || (c as any)._id === id) ? res.data : c));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTestCase = async (id: string) => {
        try {
            await api.delete(`/tests/${id}`);
            setTestCases(testCases.filter(t => t.id !== id && (t as any)._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteBug = async (id: string) => {
        try {
            await api.delete(`/bugs/${id}`);
            setBugs(bugs.filter(b => b.id !== id && (b as any)._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const updateTestCase = async (id: string, updates: Partial<Omit<TestCase, 'id' | 'createdAt' | 'createdBy'>>) => {
        try {
            const res = await api.put(`/tests/${id}`, updates);
            setTestCases(testCases.map(t => (t.id === id || (t as any)._id === id) ? res.data : t));
        } catch (err) {
            console.error(err);
        }
    };

    const updateBug = async (id: string, updates: Partial<Omit<Bug, 'id' | 'createdAt' | 'createdBy'>>) => {
        try {
            const res = await api.put(`/bugs/${id}`, updates);
            setBugs(bugs.map(b => (b.id === id || (b as any)._id === id) ? res.data : b));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <DataContext.Provider value={{
            projects,
            testCases,
            bugs,
            notes,
            notifications,
            comments,
            activeProjectId,
            isLoading,
            setActiveProjectId: handleSetActiveProjectId,
            addProject,
            deleteProject,
            updateProjectPermissions,
            addTeamMember,
            removeTeamMember,
            addTestCase,
            updateTestCase,
            addBug,
            updateBug,
            deleteTestCase,
            deleteBug,
            updateBugStatus,
            updateTestCaseStatus,
            linkItems,
            unlinkItems,
            addNote,
            updateNote,
            deleteNote,
            addNotification,
            markNotificationAsRead,
            clearAllNotifications,
            addComment,
            markCommentAsResolved,
            refetchData: fetchData
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
