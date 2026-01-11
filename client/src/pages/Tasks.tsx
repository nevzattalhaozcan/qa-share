import { useData } from '../context/DataContext';
import { Plus, Filter, ArrowUpDown, CheckSquare, LayoutList, Trello } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { PageLoadingSkeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useScrollPosition } from '../hooks/useScrollPosition';
import StatusDropdown from '../components/StatusDropdown';
import { usePermissions } from '../hooks/usePermissions';
import TaskBoard from '../components/TaskBoard';

export default function Tasks() {
    const { tasks, projects, activeProjectId, isLoading, updateTask } = useData();
    const { canCreateTasks, canEditTasks } = usePermissions();
    const location = useLocation();
    const [showFilters, setShowFilters] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [view, setView] = useState<'list' | 'board'>('list');

    // Persist filters to URL
    const { filters, toggleFilter, updateFilter } = useUrlFilters({
        status: [] as string[],
        tags: [] as string[],
        sort: 'newest' // Default sort
    });

    // Persist scroll position
    useScrollPosition('tasks-scroll', isLoading);

    const projectTasks = tasks.filter(t => String(t.projectId) === String(activeProjectId));
    const project = projects.find(p => String(p.id) === String(activeProjectId) || String((p as any)._id) === String(activeProjectId));

    const statusPriority = {
        'To Do': 0,
        'In Progress': 1,
        'Done': 2
    };

    const priorityOrder = {
        'High': 2,
        'Medium': 1,
        'Low': 0
    };

    // Filter tasks
    const filteredTasks = projectTasks.filter(task => {
        if (filters.status.length > 0 && !filters.status.includes(task.status)) {
            return false;
        }
        if (filters.tags.length > 0) {
            const taskTags = task.tags || [];
            if (!filters.tags.some(tag => taskTags.includes(tag))) {
                return false;
            }
        }
        return true;
    }).sort((a, b) => {
        switch (filters.sort) {
            case 'oldest':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'status':
                return (statusPriority[a.status as keyof typeof statusPriority] || 0) -
                    (statusPriority[b.status as keyof typeof statusPriority] || 0);
            case 'priority':
                return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
                    (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
            case 'newest':
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const statusColors: Record<string, string> = {
        'To Do': 'bg-slate-500/10 text-slate-500',
        'In Progress': 'bg-blue-500/10 text-blue-500',
        'Done': 'bg-green-500/10 text-green-500'
    };

    // Show loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Tasks</h1>
                </div>
                <PageLoadingSkeleton type="bugs" count={4} />
            </div>
        );
    }

    const renderTaskCard = (task: typeof tasks[0]) => {
        const taskId = (task as any)._id || task.id;
        return (
            <div key={taskId} className="glass-card p-4 rounded-xl space-y-2 hover:bg-white/5 transition-colors relative">
                <Link to={`/tasks/${taskId}`} state={{ from: location }} className="block">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'High' ? 'bg-orange-500/20 text-orange-500' :
                            task.priority === 'Medium' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-slate-500/20 text-slate-400'
                            }`}>
                            {task.priority}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {task.tags.map(tag => (
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
                            currentStatus={task.status}
                            options={['To Do', 'In Progress', 'Done']}
                            onUpdate={(status) => updateTask(taskId, { status: status as any })}
                            colorMap={{
                                'To Do': 'bg-slate-500/10 text-slate-400',
                                'In Progress': 'bg-blue-500/10 text-blue-500',
                                'Done': 'bg-green-500/10 text-green-500'
                            }}
                            disabled={!canEditTasks && !canCreateTasks}
                        />
                        {task.attachments && task.attachments.length > 0 && (
                            <span className="text-xs text-muted-foreground" title={`${task.attachments.length} attachments`}>📎 {task.attachments.length}</span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-hidden">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">Tasks</h1>
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => setView('list')}
                            className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' : 'text-muted-foreground hover:text-white'}`}
                            title="List View"
                        >
                            <LayoutList size={20} />
                        </button>
                        <button
                            onClick={() => setView('board')}
                            className={`p-1.5 rounded-lg transition-all ${view === 'board' ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' : 'text-muted-foreground hover:text-white'}`}
                            title="Board View"
                        >
                            <Trello size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Sort Dropdown - only show in list view */}
                    {view === 'list' && (
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
                                                    { label: 'By Priority', value: 'priority' },
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
                    )}

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-full transition-colors ${showFilters || filters.status.length > 0 || filters.tags.length > 0
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                        title="Filter"
                    >
                        <Filter size={24} />
                    </button>
                    {canCreateTasks && (
                        <Link
                            to="/tasks/create"
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
                            {['To Do', 'In Progress', 'Done'].map(status => (
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
                </div>
            )}

            {/* View Content */}
            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                    >
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-slate-800/50">
                                    <CheckSquare size={48} className="text-slate-600" />
                                </div>
                                <p>No tasks {filters.status.length > 0 || filters.tags.length > 0 ? 'match the filters' : 'created yet'}.</p>
                            </div>
                        ) : (
                            filteredTasks.map(renderTaskCard)
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="board"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {project && (
                            <TaskBoard
                                project={project}
                                tasks={filteredTasks}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
