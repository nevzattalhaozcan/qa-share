import { useData } from '../context/DataContext';
import { Plus, RotateCcw, Filter, CheckSquare, Square, X, ArrowUpDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import StatusDropdown from '../components/StatusDropdown';
import TestCaseActionModal from '../components/TestCaseActionModal';
import { useState, useEffect } from 'react';
import { getLatestTestRunsBatch } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useScrollPosition } from '../hooks/useScrollPosition';

interface TestRun {
    _id: string;
    runId: string;
    status: 'Pass' | 'Fail';
    runDateTime: string;
}

export default function TestCases() {
    const location = useLocation();
    const navigate = useNavigate();
    const { testCases, activeProjectId, updateTestCaseStatus, isLoading } = useData();
    const { canCreateTestCases, canEditTestCases } = usePermissions();
    const [latestRuns, setLatestRuns] = useState<{ [key: string]: TestRun }>({});
    const [showFilters, setShowFilters] = useState(false);

    // Persist filters to URL
    const { filters, toggleFilter, updateFilter } = useUrlFilters({
        status: [] as string[],
        priority: [] as string[],
        tags: [] as string[],
        search: '',
        sort: 'newest' // Default sort
    });

    // Persist scroll position
    useScrollPosition('testCases-scroll', isLoading);

    // Selection mode state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showActionModal, setShowActionModal] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    const projectTestCases = testCases.filter(t => String(t.projectId) === String(activeProjectId));

    useEffect(() => {
        const fetchLatestRuns = async () => {
            if (projectTestCases.length === 0) return;

            const testCaseIds = projectTestCases.map(t => (t as any)._id || t.id);
            try {
                const runs = await getLatestTestRunsBatch(testCaseIds);
                setLatestRuns(runs);
            } catch (error) {
                console.error('Error fetching latest runs:', error);
            }
        };

        fetchLatestRuns();
    }, [projectTestCases.length]);

    const handleResetStatus = async (e: React.MouseEvent, testId: string) => {
        e.preventDefault();
        e.stopPropagation();
        await updateTestCaseStatus(testId, 'Todo');
    };

    const handleStatusUpdate = async (testId: string, newStatus: string) => {
        if (newStatus === 'Fail') {
            // Optimistically update status to Fail before navigating
            await updateTestCaseStatus(testId, 'Fail');
            navigate('/bugs/create', {
                state: {
                    linkedTestCaseId: testId,
                    returnTo: location
                }
            });
        } else {
            updateTestCaseStatus(testId, newStatus as any);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        const allIds = filteredTestCases.map(t => (t as any)._id || t.id);
        setSelectedIds(new Set(allIds));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleActionComplete = () => {
        exitSelectionMode();
    };

    const statusPriority = {
        'Fail': 0,
        'Pass': 1,
        'In Progress': 2,
        'Todo': 3,
        'Draft': 4
    };

    const filteredTestCases = projectTestCases.filter(test => {
        const testId = (test as any)._id || test.id;
        const latestRun = latestRuns[testId];
        const displayStatus = latestRun ? latestRun.status : test.status;

        if (filters.status.length > 0 && !filters.status.includes(displayStatus)) {
            return false;
        }
        if (filters.priority.length > 0 && !filters.priority.includes(test.priority)) {
            return false;
        }
        if (filters.tags.length > 0) {
            const testTags = test.tags || [];
            if (!filters.tags.some(tag => testTags.includes(tag))) {
                return false;
            }
        }

        // Unified Search Logic
        if (filters.search) {
            const term = filters.search.toLowerCase();
            const matches =
                test.title.toLowerCase().includes(term) ||
                test.description.toLowerCase().includes(term) ||
                (test.tags && test.tags.some(t => t.toLowerCase().includes(term)));

            if (!matches) return false;
        }

        return true;
    }).sort((a, b) => {
        const testIdA = (a as any)._id || a.id;
        const testIdB = (b as any)._id || b.id;
        const statusA = latestRuns[testIdA]?.status || a.status;
        const statusB = latestRuns[testIdB]?.status || b.status;

        switch (filters.sort) {
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'status':
                return (statusPriority[statusA as keyof typeof statusPriority] || 99) -
                    (statusPriority[statusB as keyof typeof statusPriority] || 99);
            case 'id':
                // Natural sort (TC-2 before TC-10)
                return (a.friendlyId || '').localeCompare(b.friendlyId || '', undefined, { numeric: true });
            case 'newest':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const statusColors: Record<string, string> = {
        'Draft': 'bg-gray-500/10 text-gray-400',
        'Pass': 'bg-green-500/10 text-green-500',
        'Fail': 'bg-red-500/10 text-red-500',
        'In Progress': 'bg-blue-500/10 text-blue-500',
        'Todo': 'bg-slate-500/10 text-slate-500'
    };

    // Show loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Test Cases</h1>
                </div>
                <PageLoadingSkeleton type="cards" count={4} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Test Cases</h1>
                <div className="flex items-center gap-2">
                    {/* Selection Mode Toggle */}
                    {canEditTestCases && projectTestCases.length > 0 && (
                        <button
                            onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
                            className={`p-2 rounded-full transition-colors ${selectionMode
                                ? 'bg-primary text-white'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                                }`}
                            title={selectionMode ? 'Exit Selection Mode' : 'Select Test Cases'}
                        >
                            {selectionMode ? <X size={24} /> : <CheckSquare size={24} />}
                        </button>
                    )}

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
                        className={`p-2 rounded-full transition-colors ${showFilters || filters.status.length > 0 || filters.priority.length > 0 || !!filters.search
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                        title="Filter"
                    >
                        <Filter size={24} />
                    </button>
                    {canCreateTestCases && (
                        <Link
                            to="/tests/create"
                            className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        >
                            <Plus size={24} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Selection Mode Header */}
            {selectionMode && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20"
                >
                    <span className="text-sm font-medium text-primary">
                        {selectedIds.size} of {filteredTestCases.length} selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={selectAll}
                            className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-muted-foreground hover:bg-white/20 transition-colors"
                        >
                            Deselect All
                        </button>
                    </div>
                </motion.div>
            )}

            {showFilters && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Search</h3>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            placeholder="Search by title, description, or tag..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Draft', 'Todo', 'In Progress', 'Pass', 'Fail'].map(status => (
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
                        <h3 className="text-sm font-semibold mb-2">Priority</h3>
                        <div className="flex flex-wrap gap-2">
                            {['High', 'Medium', 'Low'].map(priority => (
                                <button
                                    key={priority}
                                    onClick={() => toggleFilter('priority', priority)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.priority.includes(priority)
                                        ? (priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                            priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-green-500/10 text-green-500') + ' border-2 border-current'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                        }`}
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {filteredTestCases.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No test cases {filters.status.length > 0 || filters.priority.length > 0 ? 'match the filters' : 'yet'}.</p>
                        {filters.status.length === 0 && filters.priority.length === 0 && (
                            <p className="text-sm">Create one to get started.</p>
                        )}
                    </div>
                ) : (
                    filteredTestCases.map((test) => {
                        const testId = (test as any)._id || test.id;
                        const latestRun = latestRuns[testId];
                        const displayStatus = latestRun ? latestRun.status : test.status;
                        const isSelected = selectedIds.has(testId);

                        return (
                            <div
                                key={testId}
                                className={`glass-card p-4 rounded-xl space-y-2 transition-all relative ${selectionMode
                                    ? isSelected
                                        ? 'ring-2 ring-primary bg-primary/5'
                                        : 'hover:bg-white/5 cursor-pointer'
                                    : 'hover:bg-white/5'
                                    }`}
                                onClick={selectionMode ? () => toggleSelection(testId) : undefined}
                            >
                                {/* Selection Checkbox */}
                                {selectionMode && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className={`p-1 rounded-lg ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </div>
                                    </div>
                                )}

                                {selectionMode ? (
                                    // Non-clickable content in selection mode
                                    <div className="block pr-10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {test.friendlyId && (
                                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded mb-1 inline-block">
                                                        {test.friendlyId}
                                                    </span>
                                                )}
                                                <h3 className="font-semibold text-lg">{test.title}</h3>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                                test.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-green-500/10 text-green-500'
                                                }`}>
                                                {test.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{test.description}</p>
                                        {test.tags && test.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {test.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Normal link behavior
                                    <Link to={`/tests/${testId}`} state={{ from: location }} className="block">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {test.friendlyId && (
                                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded mb-1 inline-block">
                                                        {test.friendlyId}
                                                    </span>
                                                )}
                                                <h3 className="font-semibold text-lg">{test.title}</h3>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                                                test.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-green-500/10 text-green-500'
                                                }`}>
                                                {test.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{test.description}</p>
                                        {test.tags && test.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {test.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </Link>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                                    <div className="flex items-center gap-2">
                                        <StatusDropdown
                                            currentStatus={displayStatus}
                                            options={['Draft', 'Todo', 'In Progress', 'Pass', 'Fail']}
                                            onUpdate={(status) => handleStatusUpdate(testId, status)}
                                            colorMap={statusColors}
                                            disabled={!canEditTestCases || selectionMode}
                                        />
                                        {canEditTestCases && !selectionMode && (displayStatus === 'Pass' || displayStatus === 'Fail') && (
                                            <button
                                                onClick={(e) => handleResetStatus(e, testId)}
                                                className="p-1.5 hover:bg-slate-500/20 rounded-lg transition-colors text-slate-400 hover:text-slate-300"
                                                title="Reset to To Do"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(test.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Action Bar */}
            <AnimatePresence>
                {selectionMode && selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-4 right-4 z-[60]"
                    >
                        <div className="glass-card rounded-2xl p-4 flex items-center justify-between max-w-md mx-auto shadow-2xl border border-primary/20">
                            <span className="text-sm font-medium">
                                {selectedIds.size} selected
                            </span>
                            <button
                                onClick={() => setShowActionModal(true)}
                                className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                            >
                                Actions
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Modal */}
            <TestCaseActionModal
                isOpen={showActionModal}
                onClose={() => setShowActionModal(false)}
                selectedTestCaseIds={Array.from(selectedIds)}
                onComplete={handleActionComplete}
            />
        </div>
    );
}

