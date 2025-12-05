import { useData } from '../context/DataContext';
import { Plus, RotateCcw, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import StatusDropdown from '../components/StatusDropdown';
import { useState, useEffect } from 'react';
import { getLatestTestRunsBatch } from '../lib/api';

interface TestRun {
    _id: string;
    runId: string;
    status: 'Pass' | 'Fail';
    runDateTime: string;
}

export default function TestCases() {
    const { testCases, activeProjectId, updateTestCaseStatus } = useData();
    const { canCreateTestCases, canEditTestCases } = usePermissions();
    const [latestRuns, setLatestRuns] = useState<{ [key: string]: TestRun }>({});
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: [] as string[],
        priority: [] as string[],
        tags: [] as string[],
    });

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

    const toggleFilter = (type: 'status' | 'priority' | 'tags', value: string) => {
        setFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(value)
                ? prev[type].filter(v => v !== value)
                : [...prev[type], value]
        }));
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
        return true;
    });

    const statusColors: Record<string, string> = {
        'Draft': 'bg-gray-500/10 text-gray-400',
        'Pass': 'bg-green-500/10 text-green-500',
        'Fail': 'bg-red-500/10 text-red-500',
        'In Progress': 'bg-blue-500/10 text-blue-500',
        'Todo': 'bg-slate-500/10 text-slate-500'
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Test Cases</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-full transition-colors ${
                            showFilters || filters.status.length > 0 || filters.priority.length > 0 || filters.tags.length > 0
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

            {showFilters && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Draft', 'Todo', 'In Progress', 'Pass', 'Fail'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => toggleFilter('status', status)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        filters.status.includes(status)
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
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        filters.priority.includes(priority)
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
                    <div>
                        <h3 className="text-sm font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {['ui', 'backend', 'db', 'mobile', 'web'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleFilter('tags', tag)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        filters.tags.includes(tag)
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
                        
                        return (
                            <div key={testId} className="glass-card p-4 rounded-xl space-y-2 hover:bg-white/5 transition-colors relative">
                                <Link to={`/tests/${testId}`} className="block">
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

                                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                                    <div className="flex items-center gap-2">
                                        <StatusDropdown
                                            currentStatus={displayStatus}
                                            options={['Draft', 'Todo', 'In Progress', 'Pass', 'Fail']}
                                            onUpdate={(status) => updateTestCaseStatus(testId, status as any)}
                                            colorMap={statusColors}
                                            disabled={!canEditTestCases}
                                        />
                                        {canEditTestCases && (displayStatus === 'Pass' || displayStatus === 'Fail') && (
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
        </div>
    );
}
