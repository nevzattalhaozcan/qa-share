import { Droppable } from '@hello-pangea/dnd';
import type { Task, TaskBoardColumn, TaskBoardSettings } from '../context/DataContext';
import TaskCard from './TaskCard';
import { MoreVertical } from 'lucide-react';

interface TaskColumnProps {
    column: TaskBoardColumn;
    tasks: Task[];
    settings?: TaskBoardSettings;
}

interface TaskColumnProps {
    column: TaskBoardColumn;
    tasks: Task[];
    settings?: TaskBoardSettings;
    droppableId?: string;
    hideHeader?: boolean;
}

export default function TaskColumn({ column, tasks, settings, droppableId, hideHeader }: TaskColumnProps) {
    return (
        <div className={`flex flex-col w-72 min-w-72 h-full ${hideHeader ? 'bg-transparent' : 'bg-slate-900/40'} rounded-2xl border border-white/5 pb-2`}>
            {!hideHeader && (
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">{column.title}</h3>
                        <span className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-muted-foreground">
                            {tasks.length}
                        </span>
                    </div>
                    <button className="p-1 hover:bg-white/5 rounded text-muted-foreground">
                        <MoreVertical size={16} />
                    </button>
                </div>
            )}

            <Droppable droppableId={droppableId || column.status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto px-2 min-h-[200px] transition-colors rounded-b-2xl ${snapshot.isDraggingOver ? 'bg-primary/5' : ''
                            }`}
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={(task as any)._id || task.id}
                                task={task}
                                index={index}
                                settings={settings}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
