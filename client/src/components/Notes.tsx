import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Copy, Share2, Trash2, Plus, Check, Key, Pin, EyeOff, Eye, X } from 'lucide-react';
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

    const isQA = user?.role === 'QA';

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
                                                onClick={() => setSelectedNote(note)}
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
                                        {note.hidden && isQA && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-semibold uppercase tracking-wide">
                                                Hidden
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons - Always visible on mobile, hover on desktop */}
                                    <div className="flex items-center gap-0.5">
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNote(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[100] max-w-md mx-auto"
                        >
                            <div className="glass-card rounded-2xl p-6 shadow-2xl border border-white/10 space-y-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-primary mb-2">
                                            <Key size={16} />
                                            <span className="text-xs font-bold tracking-wider uppercase opacity-80">Key</span>
                                        </div>
                                        <h3 className="text-xl font-bold break-words">{selectedNote.label}</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedNote(null)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                                        <span className="text-xs font-bold tracking-wider uppercase opacity-80">Value</span>
                                        <button
                                            onClick={() => handleCopy('modal-val', selectedNote.content)}
                                            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-xs flex items-center gap-1"
                                        >
                                            {copiedId === 'modal-val' ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-base font-mono text-white whitespace-pre-wrap break-words">
                                        {linkifyText(selectedNote.content)}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            const noteId = (selectedNote as any)._id || selectedNote.id;
                                            handleTogglePin(noteId, selectedNote.pinned || false);
                                            setSelectedNote(null);
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${selectedNote.pinned
                                                ? 'bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30'
                                                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <Pin size={18} className={selectedNote.pinned ? 'fill-current' : ''} />
                                        {selectedNote.pinned ? 'Unpin' : 'Pin'}
                                    </button>

                                    {isQA && (
                                        <button
                                            onClick={() => {
                                                const noteId = (selectedNote as any)._id || selectedNote.id;
                                                handleToggleHide(noteId, selectedNote.hidden || false);
                                                setSelectedNote(null);
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${selectedNote.hidden
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30'
                                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {selectedNote.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                            {selectedNote.hidden ? 'Unhide' : 'Hide'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            const noteId = (selectedNote as any)._id || selectedNote.id;
                                            deleteNote(noteId);
                                            setSelectedNote(null);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 size={18} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
