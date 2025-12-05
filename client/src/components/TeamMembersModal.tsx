import { useState } from 'react';
import { X, User as UserIcon, UserPlus, Trash2, Copy, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { useData, type TeamMember } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface TeamMembersModalProps {
    projectId: string;
    projectName: string;
    members: TeamMember[];
    createdBy: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function TeamMembersModal({
    projectId,
    projectName,
    members,
    createdBy,
    isOpen,
    onClose
}: TeamMembersModalProps) {
    const { addTeamMember, removeTeamMember } = useData();
    const { user } = useAuth();
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'QA' | 'DEV'>('DEV');
    const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string; password: string } | null>(null);
    const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    const userId = user ? ((user as any)._id || user.id) : null;
    const isQA = user?.role === 'QA';

    const handleAdd = async () => {
        if (!username.trim() || !name.trim()) return;

        const password = '123456';

        const newMember: TeamMember = {
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            username: username.trim(),
            password,
            role,
        };

        const error = await addTeamMember(projectId, newMember);

        if (error) {
            setErrorModal({ show: true, message: error });
            return;
        }

        // Show credentials to QA
        setGeneratedCredentials({ username: username.trim(), password });

        setUsername('');
        setName('');
        setRole('DEV');
    };

    const copyCredentials = () => {
        if (!generatedCredentials) return;
        const text = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`;
        navigator.clipboard.writeText(text);
    };

    const shareCredentials = () => {
        if (!generatedCredentials) return;
        const text = `Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`;
        if (navigator.share) {
            navigator.share({ text });
        } else {
            copyCredentials();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
                    >
                        <div className="glass-card rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Team Members</h2>
                                    <p className="text-sm text-muted-foreground">{projectName}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Credentials Display */}
                            {generatedCredentials && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3"
                                >
                                    <p className="text-sm font-medium text-green-400">✓ Member Added Successfully!</p>
                                    <div className="space-y-2 bg-black/20 p-3 rounded-lg font-mono text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Username:</span>
                                            <span className="ml-2 text-primary">{generatedCredentials.username}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Password:</span>
                                            <span className="ml-2 text-primary">{generatedCredentials.password}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={copyCredentials} className="flex-1">
                                            <Copy size={14} className="mr-1" /> Copy
                                        </Button>
                                        <Button size="sm" onClick={shareCredentials} className="flex-1">
                                            <Share2 size={14} className="mr-1" /> Share
                                        </Button>
                                    </div>
                                    <button
                                        onClick={() => setGeneratedCredentials(null)}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                                    >
                                        Dismiss
                                    </button>
                                </motion.div>
                            )}

                            {/* Add Member Form */}
                            {isQA && (
                                <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <UserPlus size={16} className="text-primary" />
                                        <span>Add New Member</span>
                                    </div>

                                    <Input
                                        placeholder="Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />

                                    <Input
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />

                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as 'QA' | 'DEV')}
                                        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        <option value="DEV">Developer</option>
                                        <option value="QA">QA</option>
                                    </select>

                                    <Button
                                        onClick={handleAdd}
                                        className="w-full"
                                        disabled={!username.trim() || !name.trim()}
                                    >
                                        Add Member
                                    </Button>
                                </div>
                            )}

                            {/* Members List */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Members ({members.length})
                                </h3>

                                {members.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No team members yet
                                    </div>
                                ) : (
                                    members.map((member) => {
                                        const memberId = (member as any)._id || member.id;
                                        return (
                                            <div
                                                key={memberId}
                                                onClick={() => {
                                                    const text = `Username: ${member.username}\nPassword: ${member.password}`;
                                                    navigator.clipboard.writeText(text);
                                                }}
                                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                                                title="Click to copy credentials"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{member.name}</div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <UserIcon size={12} />
                                                        <span className="truncate">{member.username}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${member.role === 'QA'
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {member.role}
                                                    </span>
                                                    {isQA && String((member as any).userId || memberId) !== String(userId) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeTeamMember(projectId, memberId);
                                                            }}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
                                                            title="Remove member"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            <Modal
                isOpen={errorModal.show}
                onClose={() => setErrorModal({ show: false, message: '' })}
                title="Error"
                message={errorModal.message}
                type="error"
                confirmText="OK"
            />
        </AnimatePresence>
    );
}
