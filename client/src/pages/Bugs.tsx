import { useData } from '../context/DataContext';
import { Plus, Filter, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import StatusDropdown from '../components/StatusDropdown';
import { useState } from 'react';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useScrollPosition } from '../hooks/useScrollPosition';

export default function Bugs() {
    const { bugs, activeProjectId, updateBugStatus, isLoading } = useData();
    const { canCreateBugs, canEditBugStatus } = usePermissions();
    const location = useLocation();
    const [showFilters, setShowFilters] = useState(false);
    const [showClosedBugs, setShowClosedBugs] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Persist filters to URL
    const { filters, toggleFilter, updateFilter } = useUrlFilters({
        status: [] as string[],
        severity: [] as string[],
        tags: [] as string[],
        sort: 'newest' // Default sort
    });

    // Persist scroll position
    useScrollPosition('bugs-scroll', isLoading);

    const projectBugs = bugs.filter(b => String(b.projectId) === String(activeProjectId));

    // Split bugs into active and closed
    const activeBugs = projectBugs.filter(b => b.status !== 'Closed');
    const closedBugs = projectBugs.filter(b => b.status === 'Closed');

    const statusPriority = {
        'Opened': 0,
        'Draft': 1,
        'Fixed': 2,
        'Closed': 3
    };

    // Filter only active bugs
    const filteredActiveBugs = activeBugs.filter(bug => {
        if (filters.status.length > 0 && !filters.status.includes(bug.status)) {
            return false;
        }
        if (filters.severity.length > 0 && !filters.severity.includes(bug.severity)) {
            return false;
        }
        if (filters.tags.length > 0) {
            const bugTags = bug.tags || [];
            if (!filters.tags.some(tag => bugTags.includes(tag))) {
                return false;
            }
        }
        return true;
    }).sort((a, b) => {
        switch (filters.sort) {
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'status':
                return (statusPriority[a.status as keyof typeof statusPriority] || 99) -
                    (statusPriority[b.status as keyof typeof statusPriority] || 99);
            case 'id':
                // Natural sort (BUG-2 before BUG-10)
                return (a.friendlyId || '').localeCompare(b.friendlyId || '', undefined, { numeric: true });
            case 'newest':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const statusColors: Record<string, string> = {
        'Draft': 'bg-gray-500/10 text-gray-400',
        'Opened': 'bg-red-500/10 text-red-500',
        'Fixed': 'bg-green-500/10 text-green-500',
        'Closed': 'bg-slate-500/10 text-slate-500'
    };

    // Show loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Bugs</h1>
                </div>
                <PageLoadingSkeleton type="bugs" count={4} />
            </div>
        );
    }

    const renderBugCard = (bug: typeof bugs[0]) => {
        const bugId = (bug as any)._id || bug.id;
        return (
            <div key={bugId} className="glass-card p-4 rounded-xl space-y-2 hover:bg-white/5 transition-colors relative hover:z-50">
                <Link to={`/bugs/${bugId}`} state={{ from: location }} className="block">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {bug.friendlyId && (
                                <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded mb-1 inline-block">
                                    {bug.friendlyId}
                                </span>
                            )}
                            <h3 className="font-semibold text-lg">{bug.title}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bug.severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                            bug.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                'bg-blue-500/10 text-blue-500'
                            }`}>
                            {bug.severity}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{bug.description}</p>
                </Link>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                    <StatusDropdown
                        currentStatus={bug.status}
                        options={['Draft', 'Opened', 'Fixed', 'Closed']}
                        onUpdate={(status) => updateBugStatus(bugId, status as any)}
                        colorMap={statusColors}
                        disabled={!canEditBugStatus}
                    />
                    <span className="text-xs text-muted-foreground">{new Date(bug.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bugs</h1>
                <div className="flex items-center gap-2">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className={`p-2 rounded-full transition-colors ${filters.sort !== 'newest'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                                }`}
                            title="Sort"
                        >
                            <ArrowUpDown size={24} />
                        </button>

                        <AnimatePresence>
                            {showSortMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowSortMenu(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-40 glass-card rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-1 space-y-0.5">
                                            {[
                                                { label: 'Newest First', value: 'newest' },
                                                { label: 'Oldest First', value: 'oldest' },
                                                { label: 'By Status', value: 'status' },
                                                { label: 'By ID', value: 'id' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        updateFilter('sort', option.value);
                                                        setShowSortMenu(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.sort === option.value
                                                        ? 'bg-primary/20 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-full transition-colors ${showFilters || filters.status.length > 0 || filters.severity.length > 0 || filters.tags.length > 0
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                        title="Filter"
                    >
                        <Filter size={24} />
                    </button>
                    {canCreateBugs && (
                        <Link
                            to="/bugs/create"
                            className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        >
                            <Plus size={24} />
                        </Link>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Draft', 'Opened', 'Fixed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => toggleFilter('status', status)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.status.includes(status)
                                        ? statusColors[status] + ' border-2 border-current'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Severity</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Critical', 'High', 'Medium', 'Low'].map(severity => (
                                <button
                                    key={severity}
                                    onClick={() => toggleFilter('severity', severity)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.severity.includes(severity)
                                        ? (severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                                            severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                                severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-blue-500/10 text-blue-500') + ' border-2 border-current'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {severity}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {['ui', 'backend', 'db', 'mobile', 'web'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleFilter('tags', tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.tags.includes(tag)
                                        ? 'bg-primary/20 text-primary border-2 border-primary'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Active Bugs List */}
            <div className="space-y-4">
                {filteredActiveBugs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No active bugs {filters.status.length > 0 || filters.severity.length > 0 || filters.tags.length > 0 ? 'match the filters' : 'reported'}.</p>
                        {filters.status.length === 0 && filters.severity.length === 0 && filters.tags.length === 0 && (
                            <p className="text-sm">Good job! Or maybe you haven't tested enough? 😉</p>
                        )}
                    </div>
                ) : (
                    filteredActiveBugs.map(renderBugCard)
                )}
            </div>

            {/* Closed Bugs Section */}
            {closedBugs.length > 0 && (
                <div className="pt-8 border-t border-white/10">
                    <button
                        onClick={() => setShowClosedBugs(!showClosedBugs)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors w-full mb-4"
                    >
                        {showClosedBugs ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <span className="font-semibold">Closed Bugs ({closedBugs.length})</span>
                    </button>

                    <AnimatePresence>
                        {showClosedBugs && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-4 pb-4">
                                    {closedBugs.map(renderBugCard)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
