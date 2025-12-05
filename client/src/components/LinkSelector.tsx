import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, X, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface LinkSelectorProps {
    type: 'test' | 'bug';
    onSelect: (id: string) => void;
    onClose: () => void;
    excludeIds?: string[];
    projectId?: string;
}

export default function LinkSelector({ type, onSelect, onClose, excludeIds = [], projectId }: LinkSelectorProps) {
    const { testCases, bugs, activeProjectId } = useData();
    const [search, setSearch] = useState('');

    // Use provided projectId or fall back to activeProjectId
    const filterProjectId = projectId || activeProjectId;

    const items = type === 'test'
        ? testCases.filter(t => {
            const tId = (t as any)._id || t.id;
            return String(t.projectId) === String(filterProjectId) && !excludeIds.includes(tId);
        })
        : bugs.filter(b => {
            const bId = (b as any)._id || b.id;
            return String(b.projectId) === String(filterProjectId) && !excludeIds.includes(bId);
        });

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.friendlyId && item.friendlyId.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <LinkIcon size={20} />
                        Link {type === 'test' ? 'Test Case' : 'Bug'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID or title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredItems.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No items found.</p>
                        ) : (
                            filteredItems.map(item => {
                                const itemId = (item as any)._id || item.id;
                                return (
                                    <button
                                        key={itemId}
                                        onClick={() => onSelect(itemId)}
                                        className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/20 group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                {item.friendlyId || 'NO-ID'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                            {item.title}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
