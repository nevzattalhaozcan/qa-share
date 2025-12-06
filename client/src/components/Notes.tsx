import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Copy, Share2, Trash2, Plus, Check, Key, Pin, EyeOff, Eye, X, Pencil, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to convert URLs to clickable links
const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

export default function Notes() {
    const { notes, addNote, updateNote, deleteNote, activeProjectId } = useData();
    const { user } = useAuth();
    const [type, setType] = useState<'simple' | 'kv'>('simple');
    const [content, setContent] = useState('');
    const [label, setLabel] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedNote, setSelectedNote] = useState<typeof notes[0] | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // New state to track how the modal was opened (View vs Edit)
    const [openedInEditMode, setOpenedInEditMode] = useState(false);

    // Edit form state
    const [editLabel, setEditLabel] = useState('');
    const [editContent, setEditContent] = useState('');

    const isQA = user?.role === 'QA';

    // Reset edit state when modal closes or note changes
    useEffect(() => {
        if (selectedNote) {
            setEditLabel(selectedNote.label || '');
            setEditContent(selectedNote.content);
        } else {
            setIsEditing(false);
            setOpenedInEditMode(false);
            setEditLabel('');
            setEditContent('');
        }
    }, [selectedNote]);

    // Sort notes: pinned first, then by creation date
    // QA can see hidden notes, others can't
    const sortedNotes = [...notes]
        .filter(note => isQA || !note.hidden) // QA sees all, others don't see hidden
        .sort((a, b) => {
            // Pinned notes come first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            // Then sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() && activeProjectId) {
            addNote({
                projectId: activeProjectId,
                type,
                content: content.trim(),
                label: type === 'kv' ? label.trim() : undefined
            });
            setContent('');
            setLabel('');
        }
    };

    const handleUpdateNote = async () => {
        if (selectedNote && editContent.trim()) {
            const noteId = (selectedNote as any)._id || selectedNote.id;
            await updateNote(noteId, {
                content: editContent.trim(),
                label: selectedNote.type === 'kv' ? editLabel.trim() : undefined
            });

            // Update local selected note to reflect changes immediately in UI
            setSelectedNote(prev => prev ? ({
                ...prev,
                content: editContent.trim(),
                label: selectedNote.type === 'kv' ? editLabel.trim() : prev.label
            }) : null);

            // If opened directly in edit mode, close the modal on save
            if (openedInEditMode) {
                setSelectedNote(null);
            } else {
                setIsEditing(false);
            }
        }
    };

    const handleCancelEdit = () => {
        // If opened directly in edit mode, close the modal on cancel
        if (openedInEditMode) {
            setSelectedNote(null);
        } else {
            setIsEditing(false);
        }
    };

    const handleCopy = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async (text: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'QA Note',
                    text: text,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback to copy if share not supported
            handleCopy('share-fallback', text);
        }
    };

    const handleTogglePin = async (id: string, currentPinned: boolean) => {
        await updateNote(id, { pinned: !currentPinned });
    };

    const handleToggleHide = async (id: string, currentHidden: boolean) => {
        await updateNote(id, { hidden: !currentHidden });
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg w-fit">
                <button
                    onClick={() => setType('simple')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'simple' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    Simple
                </button>
                <button
                    onClick={() => setType('kv')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'kv' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white'
                        }`}
                >
                    Key / Value
                </button>
            </div>

            <form onSubmit={handleAddNote} className="flex flex-col gap-2">
                {type === 'kv' && (
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Key (e.g., Username, Env)..."
                    />
                )}
                <div className="flex gap-2">
                    <Input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={type === 'kv' ? "Value (e.g., Password, Secret)..." : "Add a quick note (e.g., Test Account: user/pass)..."}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!content.trim() || (type === 'kv' && !label.trim())}>
                        <Plus size={20} />
                    </Button>
                </div>
            </form>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {sortedNotes.map((note) => {
                        const noteId = (note as any)._id || note.id;
                        const textToCopy = note.type === 'kv' ? `${note.label}: ${note.content}` : note.content;

                        return (
                            <motion.div
                                key={noteId}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`glass-card rounded-xl overflow-hidden ${note.pinned ? 'ring-2 ring-primary/30' : ''
                                    } ${note.hidden ? 'opacity-50' : ''
                                    }`}
                            >
                                {/* Note Header with actions */}
                                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {note.type === 'kv' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedNote(note);
                                                    setOpenedInEditMode(false);
                                                    setIsEditing(false);
                                                }}
                                                className="flex items-center gap-2 min-w-0 hover:bg-white/5 p-1 -ml-1 rounded transition-colors group"
                                            >
                                                <Key size={14} className="text-primary flex-shrink-0" />
                                                <span className="text-xs font-bold text-primary tracking-wider truncate group-hover:underline">
                                                    {note.label}
                                                </span>
                                            </button>
                                        )}
                                        {note.type === 'simple' && (
                                            <span className="text-xs text-muted-foreground">Quick Note</span>
                                        )}
                                    </div>

                                    {/* Action Buttons - Always visible on mobile, hover on desktop */}
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            onClick={() => {
                                                setSelectedNote(note);
                                                setOpenedInEditMode(true);
                                                setIsEditing(true);
                                            }}
                                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleTogglePin(noteId, note.pinned || false)}
                                            className={`p-1.5 hover:bg-white/10 rounded-md transition-colors ${note.pinned ? 'text-primary' : 'text-slate-400 hover:text-white'
                                                }`}
                                            title={note.pinned ? 'Unpin' : 'Pin to top'}
                                        >
                                            <Pin size={14} className={note.pinned ? 'fill-current' : ''} />
                                        </button>
                                        <button
                                            onClick={() => handleCopy(noteId, textToCopy)}
                                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                            title="Copy"
                                        >
                                            {copiedId === noteId ? (
                                                <Check size={14} className="text-green-400" />
                                            ) : (
                                                <Copy size={14} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleShare(textToCopy)}
                                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                            title="Share"
                                        >
                                            <Share2 size={14} />
                                        </button>
                                        {isQA && (
                                            <button
                                                onClick={() => handleToggleHide(noteId, note.hidden || false)}
                                                className={`p-1.5 hover:bg-yellow-500/20 rounded-md transition-colors ${note.hidden ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'
                                                    }`}
                                                title={note.hidden ? 'Unhide note' : 'Hide note from DEV users'}
                                            >
                                                {note.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNote(noteId)}
                                            className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors text-slate-400 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Note Content */}
                                <div className="p-3">
                                    <p className="text-sm whitespace-pre-wrap font-mono text-slate-200 break-words leading-relaxed">
                                        {linkifyText(note.content)}
                                    </p>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {sortedNotes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No notes yet. Add one above!
                    </div>
                )}
            </div>

            {/* Note Detail Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <>
                        {/* Backdrop - Increased z-index to 9990 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNote(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9990]"
                        />
                        {/* Modal Container - Decreased width to max-w-sm for sleeker look */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[9999] max-w-sm mx-auto"
                        >
                            {/* Glass Card - Reduced padding */}
                            <div className="glass-card rounded-2xl p-4 shadow-2xl border border-white/10 space-y-4 max-h-[85vh] overflow-y-auto flex flex-col">
                                <div className="flex items-start justify-between gap-4 flex-shrink-0">
                                    <div className="space-y-1 w-full relative">
                                        <div className="flex items-center gap-2 text-primary mb-1">
                                            <Key size={14} />
                                            <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">Key</span>
                                        </div>
                                        {isEditing ? (
                                            selectedNote.type === 'kv' ? (
                                                <input
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    className="w-full text-lg font-bold bg-transparent border-0 border-b border-transparent focus:border-primary/50 focus:ring-0 p-0 placeholder:text-muted-foreground/50 transition-colors"
                                                    placeholder="Key/Label"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Quick Note (No Label)</span>
                                            )
                                        ) : (
                                            <h3 className="text-lg font-bold break-words leading-tight">{selectedNote.label || 'Quick Note'}</h3>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        {!isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedNote(null)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 flex-grow overflow-y-auto min-h-[100px]">
                                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                                        <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">Value</span>
                                        {!isEditing && (
                                            <button
                                                onClick={() => handleCopy('modal-val', selectedNote.content)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors text-[10px] flex items-center gap-1 opacity-70 hover:opacity-100"
                                            >
                                                {copiedId === 'modal-val' ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                                                Copy
                                            </button>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full min-h-[200px] bg-white/5 border-0 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y font-mono leading-relaxed"
                                            placeholder="Note content..."
                                        />
                                    ) : (
                                        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                            <p className="text-sm font-mono text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                                                {linkifyText(selectedNote.content)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-white/5 flex-shrink-0">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateNote}
                                                disabled={!editContent.trim() || (selectedNote.type === 'kv' && !editLabel.trim())}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Save size={14} />
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex w-full gap-2">
                                            <button
                                                onClick={() => {
                                                    const noteId = (selectedNote as any)._id || selectedNote.id;
                                                    handleTogglePin(noteId, selectedNote.pinned || false);
                                                    setSelectedNote(null);
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${selectedNote.pinned
                                                    ? 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30'
                                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                <Pin size={14} className={selectedNote.pinned ? 'fill-current' : ''} />
                                                {selectedNote.pinned ? 'Unpin' : 'Pin'}
                                            </button>

                                            {isQA && (
                                                <button
                                                    onClick={() => {
                                                        const noteId = (selectedNote as any)._id || selectedNote.id;
                                                        handleToggleHide(noteId, selectedNote.hidden || false);
                                                        setSelectedNote(null);
                                                    }}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${selectedNote.hidden
                                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30'
                                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {selectedNote.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                                    {selectedNote.hidden ? 'Unhide' : 'Hide'}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    const noteId = (selectedNote as any)._id || selectedNote.id;
                                                    deleteNote(noteId);
                                                    setSelectedNote(null);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
