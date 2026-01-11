import { Link, useLocation } from 'react-router-dom';
import type { Task, TaskBoardSettings } from '../context/DataContext';
import { useData } from '../context/DataContext';
import { Draggable } from '@hello-pangea/dnd';
import { Layers, Link as LinkIcon, Paperclip, Bug, ClipboardCheck } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    index: number;
    settings?: TaskBoardSettings;
}

export default function TaskCard({ task, index, settings }: TaskCardProps) {
    const location = useLocation();
    const { tasks, projects } = useData();
    const taskId = (task as any)._id || task.id;
    const project = projects.find(p => (p as any)._id === task.projectId || p.id === task.projectId);

    const resolveUserName = (userId: string | undefined) => {
        if (!userId) return null;
        const member = project?.members.find(m =>
            m.id === userId ||
            (m as any)._id === userId ||
            (m as any).userId === userId
        );
        return member ? member.name : userId;
    };

    const assignee = resolveUserName(task.assignedTo);
    const reporter = task.reporter ? resolveUserName(task.reporter) : (task as any).createdBy ? resolveUserName((task as any).createdBy) : null;

    const showPriority = settings?.visibleFields.priority !== false;
    const showTags = settings?.visibleFields.tags !== false;
    const showAssignee = settings?.visibleFields.assignee !== false;
    const showReporter = settings?.visibleFields.reporter !== false;

    const subtasks = tasks.filter(t => t.parentId === taskId);
    const parentTask = task.parentId ? tasks.find(t => (t as any)._id === task.parentId || t.id === task.parentId) : null;

    const linkedBugs = task.links?.filter(l => l.targetType === 'Bug') || [];
    const linkedTests = task.links?.filter(l => l.targetType === 'TestCase') || [];
    const otherTasks = task.links?.filter(l => l.targetType === 'Task') || [];

    return (
        <Draggable draggableId={taskId} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`glass-card p-3 rounded-xl mb-3 hover:bg-white/5 transition-colors group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/50 bg-white/10' : ''
                        }`}
                >
                    <Link to={`/tasks/${taskId}`} state={{ from: location }} className="block space-y-2">
                        {parentTask && (
                            <div className="flex items-center gap-1 text-[9px] text-primary font-medium opacity-80 uppercase tracking-wider mb-1">
                                <Layers size={10} />
                                <span className="truncate">Subtask of: {parentTask.title}</span>
                            </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                                {task.title}
                            </h4>
                            {showPriority && (
                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                    task.priority === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-slate-500/20 text-slate-400'
                                    }`}>
                                    {task.priority[0]}
                                </span>
                            )}
                        </div>

                        {showTags && task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {task.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                    <span>#{taskId.slice(-4)}</span>
                                    {showAssignee && assignee && (
                                        <span className="text-primary truncate max-w-[80px]" title={`Assigned to ${assignee}`}>
                                            • {assignee.split(' ')[0]}
                                        </span>
                                    )}
                                    {showReporter && reporter && (
                                        <span className="text-muted-foreground truncate max-w-[80px]" title={`Reporter: ${reporter}`}>
                                            • R: {reporter.split(' ')[0]}
                                        </span>
                                    )}
                                </span>
                                {subtasks.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-primary" title={`${subtasks.length} subtasks`}>
                                        <Layers size={10} />
                                        {subtasks.length}
                                    </span>
                                )}
                                {task.attachments && task.attachments.length > 0 && (
                                    <span title={`${task.attachments.length} attachments`}><Paperclip size={10} /></span>
                                )}
                                {linkedBugs.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-red-500" title={`${linkedBugs.length} linked bugs`}>
                                        <Bug size={10} />
                                        {linkedBugs.length}
                                    </span>
                                )}
                                {linkedTests.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-green-500" title={`${linkedTests.length} linked test cases`}>
                                        <ClipboardCheck size={10} />
                                        {linkedTests.length}
                                    </span>
                                )}
                                {otherTasks.length > 0 && (
                                    <span className="flex items-center gap-0.5" title={`${otherTasks.length} linked tasks`}>
                                        <LinkIcon size={10} />
                                        {otherTasks.length}
                                    </span>
                                )}
                            </div>
                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                    </Link>
                </div>
            )}
        </Draggable>
    );
}
