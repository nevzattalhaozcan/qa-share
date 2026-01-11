import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Link as LinkIcon, FileText, Trash2, Edit, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import LinkSelector from '../components/LinkSelector';
import StatusDropdown from '../components/StatusDropdown';
import CommentSection from '../components/CommentSection';
import { AnimatePresence, motion } from 'framer-motion';
import { formatListText } from '../lib/utils';
import LinkItemModal from '../components/LinkItemModal';

export default function BugDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { bugs, testCases, tasks, updateBugStatus, linkItems, unlinkItems, deleteBug, updateBug } = useData();
    const { canEditBugStatus, canEditBugs } = usePermissions();
    const { user } = useAuth();
    const [showLinkSelector, setShowLinkSelector] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLinkTaskModal, setShowLinkTaskModal] = useState(false);
    const [viewerAttachment, setViewerAttachment] = useState<{ url: string; type: 'image' | 'video' | 'file'; index: number } | null>(null);

    const bug = bugs.find(b => b.id === id || (b as any)._id === id);

    // Check if current user can delete this bug (created by them or is QA)
    const canDeleteBug = user?.role === 'QA' || bug?.createdBy === user?.id;

    // Check if current user can link items (QA or bug creator)
    const canLinkItem = user?.role === 'QA' || bug?.createdBy === user?.id;

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

    const handleSwipe = (direction: 'left' | 'right') => {
        if (!viewerAttachment || !bug) return;
        const attachments = bug.attachments || [];
        const currentIndex = viewerAttachment.index;
        if (direction === 'right' && currentIndex > 0) {
            const prevUrl = attachments[currentIndex - 1];
            const type = getAttachmentType(prevUrl);
            setViewerAttachment({ url: prevUrl, type, index: currentIndex - 1 });
        } else if (direction === 'left' && currentIndex < attachments.length - 1) {
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

    useEffect(() => {
        if (!viewerAttachment) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handleSwipe('right');
            else if (e.key === 'ArrowRight') handleSwipe('left');
            else if (e.key === 'Escape') setViewerAttachment(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewerAttachment]);

    if (!bug) {
        return (
            <div className="p-4 text-center">
                <p>Bug not found</p>
                <Button variant="link" onClick={() => navigate('/bugs')}>Back to list</Button>
            </div>
        );
    }

    const linkedTestCases = testCases.filter(t => {
        const testId = (t as any)._id || t.id;
        return bug.linkedTestCaseIds?.some(linkedId => String(linkedId) === String(testId));
    });

    const linkedTasks = tasks.filter(t => {
        const taskId = (t as any)._id || t.id;
        return bug.linkedTaskIds?.some(linkedId => String(linkedId) === String(taskId));
    });

    const handleStatusChange = (newStatus: typeof bug.status) => {
        const bugId = (bug as any)._id || bug.id;
        updateBugStatus(bugId, newStatus);
    };

    return (
        <div className="space-y-4 pb-20">
            {/* Header */}
            <div className="glass-card p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from.pathname + location.state.from.search);
                        } else {
                            navigate('/bugs');
                        }
                    }}>
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="flex items-center gap-1">
                        {canEditBugs && (
                            <Button variant="ghost" size="icon" onClick={() => {
                                const bugId = (bug as any)._id || bug.id;
                                navigate(`/bugs/${bugId}/edit`);
                            }}>
                                <Edit size={20} />
                            </Button>
                        )}
                        {canEditBugs && canDeleteBug && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-2 mb-4">
                    {bug.friendlyId && (
                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded inline-block">
                            {bug.friendlyId}
                        </span>
                    )}
                    <h1 className="text-2xl font-bold break-words leading-tight">{bug.title}</h1>
                </div>

                <div className="flex items-center justify-between">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${bug.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            bug.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                        {bug.severity} Severity
                    </span>
                    <StatusDropdown
                        currentStatus={bug.status}
                        options={['Draft', 'Opened', 'Fixed', 'Closed']}
                        onUpdate={(status) => handleStatusChange(status as any)}
                        colorMap={{
                            'Draft': 'bg-gray-500/10 text-gray-400',
                            'Opened': 'bg-red-500/10 text-red-500',
                            'Fixed': 'bg-green-500/10 text-green-500',
                            'Closed': 'bg-slate-500/10 text-slate-400'
                        }}
                        disabled={!canEditBugStatus}
                        align="right"
                    />
                </div>
            </div>

            {/* Content Card */}
            <div className="glass-card p-6 rounded-2xl space-y-6">
                {bug.tags && bug.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                        {bug.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Description</h3>
                    <p className="text-base leading-relaxed">{bug.description || 'No description provided.'}</p>
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Steps to Reproduce</h3>
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-white/10">
                        <div
                            className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatListText(bug.stepsToReproduce) }}
                        />
                    </div>
                </div>

                {bug.testData && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Test Data</h3>
                        <div className="bg-slate-900/50 p-5 rounded-xl border border-white/10">
                            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{bug.testData}</pre>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-green-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Expected Result
                        </h3>
                        <div className="bg-green-500/5 p-5 rounded-xl border border-green-500/20">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{bug.expectedResult || 'No expected result provided.'}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-red-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Actual Result
                        </h3>
                        <div className="bg-red-500/5 p-5 rounded-xl border border-red-500/20">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{bug.actualResult || 'No actual result provided.'}</p>
                        </div>
                    </div>
                </div>

                {bug.attachments && bug.attachments.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">
                            Attachments ({bug.attachments.filter(url => url && url.trim() && !url.startsWith('blob:')).length})
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {bug.attachments
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
                                            {canEditBugs && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const bugId = (bug as any)._id || bug.id;
                                                        updateBug(bugId, {
                                                            attachments: bug.attachments.filter(u => u !== url)
                                                        });
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            {isImage ? (
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                            ) : isVideo ? (
                                                <div className="relative w-full h-full bg-black/50 flex items-center justify-center">
                                                    <video src={url} className="w-full h-full object-cover" preload="metadata" />
                                                    <div className="absolute w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                                                        <div className="w-0 h-0 border-l-6 border-l-white border-y-4 border-y-transparent ml-0.5"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
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

                {/* Linked Items Section */}
                <div className="space-y-6 pt-4 border-t border-white/5">
                    {/* Linked Test Cases */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider flex items-center gap-2">
                                <FileText size={14} />
                                Linked Test Cases
                            </h3>
                            {canLinkItem && (
                                <Button variant="ghost" size="sm" onClick={() => setShowLinkSelector(true)} className="h-8 text-xs">
                                    <LinkIcon size={12} className="mr-1" /> Link Test Case
                                </Button>
                            )}
                        </div>
                        {linkedTestCases.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No linked test cases.</p>
                        ) : (
                            <div className="space-y-2">
                                {linkedTestCases.map(test => {
                                    const testId = (test as any)._id || test.id;
                                    return (
                                        <div key={testId} className="relative group">
                                            <Link to={`/tests/${testId}`} className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        {test.friendlyId || 'TC'}
                                                    </span>
                                                    {canLinkItem && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                unlinkItems('bug', (bug as any)._id || bug.id, 'test', testId);
                                                            }}
                                                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-500 transition-all z-10"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-medium truncate">{test.title}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap ${test.status === 'Pass' ? 'border-green-500/30 text-green-500' :
                                                            test.status === 'Fail' ? 'border-red-500/30 text-red-500' :
                                                                'border-slate-500/30 text-slate-500'
                                                        }`}>
                                                        {test.status}
                                                    </span>
                                                </div>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Linked Tasks */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider flex items-center gap-2">
                                <LinkIcon size={14} />
                                Linked Tasks
                            </h3>
                            {canLinkItem && (
                                <Button variant="ghost" size="sm" onClick={() => setShowLinkTaskModal(true)} className="h-8 text-xs">
                                    <Plus size={12} className="mr-1" /> Link Task
                                </Button>
                            )}
                        </div>
                        {linkedTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No linked tasks.</p>
                        ) : (
                            <div className="space-y-2">
                                {linkedTasks.map(task => {
                                    const taskId = (task as any)._id || task.id;
                                    return (
                                        <div key={taskId} className="relative group">
                                            <Link to={`/tasks/${taskId}`} className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-orange-500' :
                                                                task.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-500'
                                                            }`} />
                                                        <span className="text-xs font-semibold">{task.status}</span>
                                                    </div>
                                                    {canLinkItem && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const newLinks = (bug.linkedTaskIds || []).filter(id => String(id) !== String(taskId));
                                                                updateBug((bug as any)._id || bug.id, { linkedTaskIds: newLinks });
                                                            }}
                                                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-500 transition-all z-10"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium truncate">{task.title}</p>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showLinkSelector && (
                    <LinkSelector
                        type="test"
                        projectId={bug.projectId}
                        onSelect={(testId) => {
                            linkItems('bug', (bug as any)._id || bug.id, 'test', testId);
                            setShowLinkSelector(false);
                        }}
                        onClose={() => setShowLinkSelector(false)}
                        excludeIds={bug.linkedTestCaseIds}
                    />
                )}
            </AnimatePresence>

            <LinkItemModal
                isOpen={showLinkTaskModal}
                onClose={() => setShowLinkTaskModal(false)}
                onLink={(targetType, targetId) => {
                    if (targetType === 'Task') {
                        const newLinks = [...(bug.linkedTaskIds || []), targetId];
                        updateBug((bug as any)._id || bug.id, { linkedTaskIds: newLinks });
                    }
                    setShowLinkTaskModal(false);
                }}
                excludeIds={bug.linkedTaskIds}
                projectId={bug.projectId}
            />

            <div className="glass-card p-6 rounded-2xl">
                <CommentSection bugId={(bug as any)._id || bug.id} />
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Bug"
                message="Are you sure you want to delete this bug? This action cannot be undone."
                type="confirm"
                onConfirm={() => {
                    deleteBug((bug as any)._id || bug.id);
                    navigate('/bugs');
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />

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
                        onDragEnd={(_e, { offset }) => {
                            if (offset.x > 100) handleSwipe('right');
                            else if (offset.x < -100) handleSwipe('left');
                        }}
                    >
                        <button onClick={() => setViewerAttachment(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full z-20">
                            <X size={24} />
                        </button>
                        {viewerAttachment.index > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); handleSwipe('right'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full z-20">
                                <ChevronLeft size={32} />
                            </button>
                        )}
                        {bug.attachments && viewerAttachment.index < bug.attachments.length - 1 && (
                            <button onClick={(e) => { e.stopPropagation(); handleSwipe('left'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full z-20">
                                <ChevronRight size={32} />
                            </button>
                        )}
                        <div className="w-full h-full flex items-center justify-center p-4">
                            {viewerAttachment.type === 'image' ? (
                                <motion.img src={viewerAttachment.url} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                            ) : viewerAttachment.type === 'video' ? (
                                <video src={viewerAttachment.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg" />
                            ) : (
                                <div className="bg-slate-800 p-8 rounded-lg text-center">
                                    <FileText size={64} className="mx-auto mb-4 text-primary" />
                                    <p className="text-lg mb-4">File Preview Not Available</p>
                                    <a href={viewerAttachment.url} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-primary rounded-lg">Download</a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
