import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Copy, Share2, Trash2, Plus, Check, Key, Pin, EyeOff } from 'lucide-react';
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
    const { notes, addNote, updateNote, deleteNote } = useData();
    const { user } = useAuth();
    const [type, setType] = useState<'simple' | 'kv'>('simple');
    const [content, setContent] = useState('');
    const [label, setLabel] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const isQA = user?.role === 'QA';

    // Sort notes: pinned first, then by creation date
    const sortedNotes = [...notes]
        .filter(note => !note.hidden) // Don't show hidden notes
        .sort((a, b) => {
            // Pinned notes come first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            // Then sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            addNote({
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

    const handleToggleHide = async (id: string) => {
        await updateNote(id, { hidden: true });
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
                                className={`glass-card rounded-xl overflow-hidden ${
                                    note.pinned ? 'ring-2 ring-primary/30' : ''
                                }`}
                            >
                                {/* Note Header with actions */}
                                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {note.type === 'kv' && (
                                            <>
                                                <Key size={14} className="text-primary flex-shrink-0" />
                                                <span className="text-xs font-bold text-primary tracking-wider truncate">
                                                    {note.label}
                                                </span>
                                            </>
                                        )}
                                        {note.type === 'simple' && (
                                            <span className="text-xs text-muted-foreground">Quick Note</span>
                                        )}
                                    </div>
                                    
                                    {/* Action Buttons - Always visible on mobile, hover on desktop */}
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            onClick={() => handleTogglePin(noteId, note.pinned || false)}
                                            className={`p-1.5 hover:bg-white/10 rounded-md transition-colors ${
                                                note.pinned ? 'text-primary' : 'text-slate-400 hover:text-white'
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
                                                onClick={() => handleToggleHide(noteId)}
                                                className="p-1.5 hover:bg-yellow-500/20 rounded-md transition-colors text-slate-400 hover:text-yellow-400"
                                                title="Hide note"
                                            >
                                                <EyeOff size={14} />
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
        </div>
    );
}
