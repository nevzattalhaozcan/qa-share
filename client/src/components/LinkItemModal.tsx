import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal } from './ui/Modal';
import { Search, Bug, FileText, Check } from 'lucide-react';

interface LinkItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLink: (type: 'Task' | 'Bug' | 'TestCase', id: string) => void;
    excludeIds?: string[];
    projectId: string;
}

export default function LinkItemModal({ isOpen, onClose, onLink, excludeIds = [], projectId }: LinkItemModalProps) {
    const { tasks, bugs, testCases } = useData();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Task' | 'Bug' | 'TestCase'>('All');

    const projectTasks = tasks.filter(t => String(t.projectId) === String(projectId) && !excludeIds.includes((t as any)._id || t.id));
    const projectBugs = bugs.filter(b => String(b.projectId) === String(projectId) && !excludeIds.includes((b as any)._id || b.id));
    const projectTests = testCases.filter(t => String(t.projectId) === String(projectId) && !excludeIds.includes((t as any)._id || t.id));

    const allItems = [
        ...projectTasks.map(t => ({ id: (t as any)._id || t.id, title: t.title, type: 'Task' as const, status: t.status })),
        ...projectBugs.map(b => ({ id: (b as any)._id || b.id, title: b.title, type: 'Bug' as const, status: b.status })),
        ...projectTests.map(t => ({ id: (t as any)._id || t.id, title: t.title, type: 'TestCase' as const, status: t.status }))
    ];

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        const matchesType = filter === 'All' || item.type === filter;
        return matchesSearch && matchesType;
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Link Item"
            className="sm:max-w-lg"
        >
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks, bugs, or test cases..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                    />
                </div>

                <div className="flex gap-2">
                    {['All', 'Task', 'Bug', 'TestCase'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === type
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {type === 'TestCase' ? 'Tests' : type + 's'}
                        </button>
                    ))}
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No items found.
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => onLink(item.type, item.id)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-primary bg-primary/10 p-2 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                        {item.type === 'Task' ? <Check size={16} /> :
                                            item.type === 'Bug' ? <Bug size={16} /> :
                                                <FileText size={16} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{item.type}</span>
                                        <span className="text-sm font-medium">{item.title}</span>
                                    </div>
                                </div>
                                <div className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-slate-400">
                                    {item.status}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
