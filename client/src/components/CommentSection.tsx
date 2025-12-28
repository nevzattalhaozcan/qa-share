import { useState, useEffect } from 'react';
import { type Comment } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { MessageCircle, CheckCircle, Reply, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentSectionProps {
    bugId?: string;
    taskId?: string;
}

export default function CommentSection({ bugId, taskId }: CommentSectionProps) {
    // const { addComment, markCommentAsResolved } = useData();
    const { user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [showResolved, setShowResolved] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);

    const entityId = bugId || taskId;

    useEffect(() => {
        const fetchComments = async () => {
            if (!entityId) return;
            try {
                // We need to import api here or pass it down. 
                // Since we are inside a component, we can import it.
                // But wait, we didn't export api from DataContext. 
                // Let's import it directly.
                const res = await import('../lib/api').then(m => m.default.get(`/comments/${entityId}`));
                setComments(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchComments();
    }, [entityId]);

    // Filter comments for this entity
    const entityComments = comments.filter(c => !c.resolved || showResolved);
    const topLevelComments = entityComments.filter(c => !c.parentId);

    const getReplies = (parentId: string) => {
        return entityComments.filter(c => c.parentId === parentId);
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user || !entityId) return;

        // We need to call addComment from context but also update local state.
        // Actually DataContext.addComment updates global state, but we disconnected that.
        // So we should probably call API directly here OR update DataContext to return the new comment.
        // DataContext.addComment currently updates 'comments' state which we are ignoring here.
        // Let's change DataContext to return the new comment?
        // OR just call API here directly. Calling API here is cleaner since we are managing state locally.

        try {
            const api = (await import('../lib/api')).default;
            const payload: any = { content: newComment.trim() };
            if (bugId) payload.bugId = bugId;
            if (taskId) payload.taskId = taskId;

            const res = await api.post('/comments', payload);
            setComments([...comments, res.data]);
            setNewComment('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddReply = async (parentId: string) => {
        if (!replyContent.trim() || !user || !entityId) return;

        try {
            const api = (await import('../lib/api')).default;
            const payload: any = {
                content: replyContent.trim(),
                parentId
            };
            if (bugId) payload.bugId = bugId;
            if (taskId) payload.taskId = taskId;

            const res = await api.post('/comments', payload);
            setComments([...comments, res.data]);
            setReplyContent('');
            setReplyTo(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleResolve = async (commentId: string) => {
        try {
            const api = (await import('../lib/api')).default;
            const res = await api.put(`/comments/${commentId}/resolve`);
            setComments(comments.map(c => {
                const cId = (c as any)._id || c.id;
                return cId === commentId ? res.data : c;
            }));
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-primary" />
                    <h3 className="font-semibold">Comments</h3>
                    <span className="text-xs text-muted-foreground">({entityComments.length})</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResolved(!showResolved)}
                    className={`text-xs gap-1 ${showResolved ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                >
                    <History size={14} />
                    {showResolved ? 'Hide History' : 'Show History'}
                </Button>
            </div>

            {/* New Comment Input */}
            <div className="space-y-2">
                <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                />
                <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    size="sm"
                >
                    Post Comment
                </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {topLevelComments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first to comment!
                    </p>
                ) : (
                    topLevelComments.map((comment) => {
                        const commentId = (comment as any)._id || comment.id;
                        const userId = user ? ((user as any)._id || user.id) : null;
                        const replies = getReplies(commentId);
                        const isOwner = comment.userId === userId;

                        return (
                            <div key={commentId} className="space-y-3">
                                {/* Main Comment */}
                                <div className="glass-card p-4 rounded-xl">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{comment.userName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm">{comment.content}</p>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleResolve(commentId)}
                                                className="p-2 hover:bg-green-500/20 rounded-lg transition-colors text-muted-foreground hover:text-green-400"
                                                title="Mark as resolved"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Reply Button */}
                                    <button
                                        onClick={() => setReplyTo(replyTo === commentId ? null : commentId)}
                                        className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Reply size={12} />
                                        Reply
                                    </button>

                                    {/* Reply Input */}
                                    <AnimatePresence>
                                        {replyTo === commentId && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 space-y-2 overflow-hidden"
                                            >
                                                <Textarea
                                                    placeholder="Write a reply..."
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleAddReply(commentId)}
                                                        disabled={!replyContent.trim()}
                                                        size="sm"
                                                    >
                                                        Reply
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            setReplyTo(null);
                                                            setReplyContent('');
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Replies */}
                                {replies.length > 0 && (
                                    <div className="ml-8 space-y-2">
                                        {replies.map((reply) => {
                                            const replyId = (reply as any)._id || reply.id;
                                            const isReplyOwner = reply.userId === userId;

                                            return (
                                                <div key={replyId} className="glass-card p-3 rounded-lg bg-white/5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{reply.userName}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(reply.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm">{reply.content}</p>
                                                        </div>
                                                        {isReplyOwner && (
                                                            <button
                                                                onClick={() => handleResolve(replyId)}
                                                                className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors text-muted-foreground hover:text-green-400"
                                                                title="Mark as resolved"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
