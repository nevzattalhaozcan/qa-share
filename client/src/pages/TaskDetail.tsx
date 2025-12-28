import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Trash2, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import StatusDropdown from '../components/StatusDropdown';
import CommentSection from '../components/CommentSection';
import { AnimatePresence, motion } from 'framer-motion';

export default function TaskDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { tasks, updateTask, deleteTask } = useData();
    const { canEditTasks, canCreateTasks } = usePermissions();
    const { user } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [viewerAttachment, setViewerAttachment] = useState<{ url: string; type: 'image' | 'video' | 'file'; index: number } | null>(null);

    const task = tasks.find(t => t.id === id || (t as any)._id === id);

    // Check if current user can delete this task (created by them or is QA/Admin)
    const canDeleteTask = user?.role === 'QA' || task?.createdBy === user?.id;
    // Check if current user can edit this task
    const canEdit = canEditTasks || (canCreateTasks && task?.createdBy === user?.id);

    // Lock body scroll when viewer is open
    useEffect(() => {
        if (viewerAttachment) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [viewerAttachment]);

    // Keyboard navigation for attachment viewer
    useEffect(() => {
        if (!viewerAttachment) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handleSwipe('right'); // Previous
            } else if (e.key === 'ArrowRight') {
                handleSwipe('left'); // Next
            } else if (e.key === 'Escape') {
                setViewerAttachment(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewerAttachment]);

    // Handle swipe navigation
    const handleSwipe = (direction: 'left' | 'right') => {
        if (!viewerAttachment || !task) return;

        const attachments = task.attachments || [];
        const currentIndex = viewerAttachment.index;

        if (direction === 'right' && currentIndex > 0) {
            // Previous attachment
            const prevUrl = attachments[currentIndex - 1];
            const type = getAttachmentType(prevUrl);
            setViewerAttachment({ url: prevUrl, type, index: currentIndex - 1 });
        } else if (direction === 'left' && currentIndex < attachments.length - 1) {
            // Next attachment
            const nextUrl = attachments[currentIndex + 1];
            const type = getAttachmentType(nextUrl);
            setViewerAttachment({ url: nextUrl, type, index: currentIndex + 1 });
        }
    };

    const getAttachmentType = (url: string): 'image' | 'video' | 'file' => {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
        return 'file';
    };

    if (!task) {
        return (
            <div className="p-4 text-center">
                <p>Task not found</p>
                <Button variant="link" onClick={() => navigate('/tasks')}>Back to list</Button>
            </div>
        );
    }

    const handleStatusChange = (newStatus: typeof task.status) => {
        const taskId = (task as any)._id || task.id;
        updateTask(taskId, { status: newStatus });
    };

    const handlePriorityChange = (newPriority: typeof task.priority) => {
        const taskId = (task as any)._id || task.id;
        updateTask(taskId, { priority: newPriority });
    };

    return (
        <div className="space-y-4 pb-20">
            {/* Header */}
            <div className="glass-card p-4 rounded-2xl">
                {/* Top Row - Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from.pathname + location.state.from.search);
                        } else {
                            navigate('/tasks');
                        }
                    }}>
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="flex items-center gap-1">
                        {/* Future Edit Task Button could go here */}
                        {canDeleteTask && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                                title="Delete task"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Middle - Title */}
                <div className="space-y-2 mb-4">
                    <h1 className="text-2xl font-bold break-words leading-tight">{task.title}</h1>
                </div>

                {/* Bottom Row - Priority and Status */}
                <div className="flex items-center justify-between">
                    <StatusDropdown
                        currentStatus={task.priority}
                        options={['Low', 'Medium', 'High']}
                        onUpdate={(priority) => handlePriorityChange(priority as any)}
                        colorMap={{
                            'Low': 'bg-slate-500/10 text-slate-400',
                            'Medium': 'bg-blue-500/10 text-blue-500',
                            'High': 'bg-orange-500/10 text-orange-500'
                        }}
                        disabled={!canEdit}
                        align="left"
                    />

                    <StatusDropdown
                        currentStatus={task.status}
                        options={['To Do', 'In Progress', 'Done']}
                        onUpdate={(status) => handleStatusChange(status as any)}
                        colorMap={{
                            'To Do': 'bg-slate-500/10 text-slate-400',
                            'In Progress': 'bg-blue-500/10 text-blue-500',
                            'Done': 'bg-green-500/10 text-green-500'
                        }}
                        disabled={!canEdit}
                        align="right"
                    />
                </div>
            </div>

            {/* Content Card */}
            <div className="glass-card p-6 rounded-2xl space-y-6">
                {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                        {task.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Description</h3>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                </div>

                {task.additionalInfo && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Additional Information</h3>
                        <div className="bg-slate-900/50 p-5 rounded-xl border border-white/10">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.additionalInfo}</p>
                        </div>
                    </div>
                )}

                {task.attachments && task.attachments.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Attachments ({task.attachments.filter(url => url && url.trim() && !url.startsWith('blob:')).length})</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {task.attachments
                                .filter(url => url && url.trim() && !url.startsWith('blob:'))
                                .map((url, index) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                    const isVideo = /\.(mp4|webm|mov)$/i.test(url);
                                    return (
                                        <div
                                            key={index}
                                            className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-slate-800/50 cursor-pointer hover:border-primary/50 transition-colors group flex-shrink-0"
                                            onClick={() => setViewerAttachment({
                                                url,
                                                type: isImage ? 'image' : isVideo ? 'video' : 'file',
                                                index
                                            })}
                                        >
                                            {canEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const taskId = (task as any)._id || task.id;
                                                        updateTask(taskId, {
                                                            attachments: task.attachments?.filter(u => u !== url) ?? []
                                                        });
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                                    title="Remove attachment"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            {isImage ? (
                                                <img
                                                    src={url}
                                                    alt={`Attachment ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" fill="gray">Image not found</text></svg>';
                                                    }}
                                                />
                                            ) : isVideo ? (
                                                <div className="relative w-full h-full bg-black/50">
                                                    <video
                                                        src={url}
                                                        className="w-full h-full object-cover"
                                                        preload="metadata"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                                                            <div className="w-0 h-0 border-l-6 border-l-white border-y-4 border-y-transparent ml-0.5"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-2">
                                                    <FileText size={32} className="text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div className="glass-card p-6 rounded-2xl">
                {/* Reusing CommentSection but I might need to adapt it if it's strictly for bugs. 
                     Checking CommentSection usage: it takes bugId, testCaseId, noteId. 
                     I might need to update CommentSection to accept taskId.
                  */}
                <CommentSection taskId={(task as any)._id || task.id} />
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                type="confirm"
                onConfirm={() => {
                    const taskId = (task as any)._id || task.id;
                    deleteTask(taskId);
                    navigate('/tasks');
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Attachment Viewer Modal */}
            <AnimatePresence>
                {viewerAttachment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                        onClick={() => setViewerAttachment(null)}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_e, { offset }) => {
                            if (offset.x > 100) {
                                handleSwipe('right'); // Swipe right = previous
                            } else if (offset.x < -100) {
                                handleSwipe('left'); // Swipe left = next
                            }
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setViewerAttachment(null);
                            }}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                        >
                            <X size={24} />
                        </button>

                        {/* Navigation Buttons */}
                        {task && task.attachments && viewerAttachment.index > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwipe('right');
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        {task && task.attachments && viewerAttachment.index < task.attachments.length - 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSwipe('left');
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}

                        <div className="w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                            {viewerAttachment.type === 'image' ? (
                                <motion.img
                                    key={viewerAttachment.url}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    src={viewerAttachment.url}
                                    alt="Attachment"
                                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                                />
                            ) : viewerAttachment.type === 'video' ? (
                                <motion.video
                                    key={viewerAttachment.url}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    src={viewerAttachment.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[90vh] rounded-lg"
                                />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-slate-800 p-8 rounded-lg text-center"
                                >
                                    <FileText size={64} className="mx-auto mb-4 text-primary" />
                                    <p className="text-lg mb-4">File Preview Not Available</p>
                                    <a
                                        href={viewerAttachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors"
                                    >
                                        Download File
                                    </a>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
