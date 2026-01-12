import { Link, useLocation } from 'react-router-dom';
import type { Task, TaskBoardSettings } from '../context/DataContext';
import { useData } from '../context/DataContext';
import { Draggable } from '@hello-pangea/dnd';

interface TaskCardProps {
    task: Task;
    index: number;
    settings?: TaskBoardSettings;
}

export default function TaskCard({ task, index }: TaskCardProps) {
    const location = useLocation();
    const { projects } = useData();
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
                    <Link to={`/tasks/${taskId}`} state={{ from: location }} className="block">
                        <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors mb-2">
                            {task.title}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-mono opacity-70">#{taskId.slice(-4)}</span>
                            {assignee && (
                                <span className="text-primary font-medium truncate max-w-[100px]" title={`Assigned to ${assignee}`}>
                                    {assignee.split(' ')[0]}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>
            )}
        </Draggable>
    );
}
