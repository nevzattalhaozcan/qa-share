import { Link, useLocation } from 'react-router-dom';
import type { Task, TaskBoardSettings } from '../context/DataContext';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
    task: Task;
    index: number;
    settings?: TaskBoardSettings;
}

export default function TaskCard({ task, index, settings }: TaskCardProps) {
    const location = useLocation();
    const taskId = (task as any)._id || task.id;

    const showPriority = settings?.visibleFields.priority !== false;
    const showTags = settings?.visibleFields.tags !== false;

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

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-white/5">
                            <span>#{taskId.slice(-4)}</span>
                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                        </div>
                    </Link>
                </div>
            )}
        </Draggable>
    );
}
