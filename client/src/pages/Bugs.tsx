import { useData } from '../context/DataContext';
import { Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import StatusDropdown from '../components/StatusDropdown';
import { useState } from 'react';

export default function Bugs() {
    const { bugs, activeProjectId, updateBugStatus } = useData();
    const { canCreateBugs, canEditBugStatus } = usePermissions();
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: [] as string[],
        severity: [] as string[],
    });

    const projectBugs = bugs.filter(b => String(b.projectId) === String(activeProjectId));

    const toggleFilter = (type: 'status' | 'severity', value: string) => {
        setFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(value)
                ? prev[type].filter(v => v !== value)
                : [...prev[type], value]
        }));
    };

    const filteredBugs = projectBugs.filter(bug => {
        if (filters.status.length > 0 && !filters.status.includes(bug.status)) {
            return false;
        }
        if (filters.severity.length > 0 && !filters.severity.includes(bug.severity)) {
            return false;
        }
        return true;
    });

    const statusColors: Record<string, string> = {
        'Draft': 'bg-gray-500/10 text-gray-400',
        'Opened': 'bg-red-500/10 text-red-500',
        'Fixed': 'bg-green-500/10 text-green-500',
        'Closed': 'bg-slate-500/10 text-slate-500'
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bugs</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-full transition-colors ${
                            showFilters || filters.status.length > 0 || filters.severity.length > 0
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
                            {['Draft', 'Opened', 'Fixed', 'Closed'].map(status => (
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
                        <h3 className="text-sm font-semibold mb-2">Severity</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Critical', 'High', 'Medium', 'Low'].map(severity => (
                                <button
                                    key={severity}
                                    onClick={() => toggleFilter('severity', severity)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        filters.severity.includes(severity)
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
                </div>
            )}

            <div className="space-y-4">
                {filteredBugs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No bugs {filters.status.length > 0 || filters.severity.length > 0 ? 'match the filters' : 'reported'}.</p>
                        {filters.status.length === 0 && filters.severity.length === 0 && (
                            <p className="text-sm">Good job! Or maybe you haven't tested enough? 😉</p>
                        )}
                    </div>
                ) : (
                    filteredBugs.map((bug) => {
                        const bugId = (bug as any)._id || bug.id;
                        return (
                            <div key={bugId} className="glass-card p-4 rounded-xl space-y-2 hover:bg-white/5 transition-colors relative hover:z-50">
                                <Link to={`/bugs/${bugId}`} className="block">
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
                    })
                )}
            </div>
        </div>
    );
}
