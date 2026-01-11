import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useData } from '../context/DataContext';
import type { Task, Project } from '../context/DataContext';
import TaskColumn from './TaskColumn';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import BoardSettingsModal from './BoardSettingsModal';

interface TaskBoardProps {
    project: Project;
    tasks: Task[];
}

export default function TaskBoard({ project, tasks }: TaskBoardProps) {
    const { updateTask } = useData();
    const [showSettings, setShowSettings] = useState(false);

    const settings = project.taskBoardSettings || {
        columns: [
            { id: 'todo', title: 'To Do', status: 'To Do' },
            { id: 'doing', title: 'Doing', status: 'In Progress' },
            { id: 'done', title: 'Done', status: 'Done' },
        ],
        visibleFields: {
            priority: true,
            tags: true,
            assignee: true,
            dueDate: true,
        }
    };

    const parentTasks = tasks.filter(t => tasks.some(sub => sub.parentId === ((t as any)._id || t.id)));
    const standaloneTasks = tasks.filter(t => !t.parentId && !tasks.some(sub => sub.parentId === ((t as any)._id || t.id)));

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Parse droppableId (it could be "status" or "parentId:status")
        const targetStatus = destination.droppableId.split(':').pop();
        if (targetStatus) {
            updateTask(draggableId, { status: targetStatus as any });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-muted-foreground transition-colors"
                >
                    <Settings2 size={16} />
                    Customize Board
                </button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto pb-4 custom-scrollbar">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex flex-col gap-8 min-w-max px-1">
                        {/* Headers row (sticky or at least fixed width alignment) */}
                        <div className="flex gap-6 sticky top-0 z-10 bg-inherit py-2">
                            {settings.columns.map(column => (
                                <div key={column.id} className="w-80 min-w-80 px-4">
                                    <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">{column.title}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Standalone Tasks Section */}
                        {standaloneTasks.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Other Tasks</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-full text-slate-500">{standaloneTasks.length}</span>
                                </div>
                                <div className="flex gap-6">
                                    {settings.columns.map(column => {
                                        const columnTasks = standaloneTasks.filter(t => t.status === column.status);
                                        return (
                                            <TaskColumn
                                                key={`standalone-${column.id}`}
                                                column={column}
                                                tasks={columnTasks}
                                                settings={settings}
                                                droppableId={`standalone:${column.status}`}
                                                hideHeader
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Parent Task Swimlanes */}
                        {parentTasks.map(parent => {
                            const pId = (parent as any)._id || parent.id;
                            const subtasks = tasks.filter(t => t.parentId === pId);
                            return (
                                <div key={`swimlane-${pId}`} className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-white/5 w-fit group cursor-pointer hover:bg-slate-800 transition-colors"
                                        onClick={() => window.location.href = `#/tasks/${pId}`}>
                                        <div className={`w-2 h-2 rounded-full ${parent.priority === 'High' ? 'bg-orange-500' :
                                                parent.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-500'
                                            }`} title={`Priority: ${parent.priority}`} />
                                        <span className="text-xs font-mono text-primary font-bold">{(parent as any).friendlyId || `#${pId.slice(-4)}`}</span>
                                        <span className="text-sm font-semibold text-slate-200">{parent.title}</span>
                                        <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
                                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{parent.status}</span>
                                            {subtasks.length > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-full text-slate-500">{subtasks.length} sub-tasks</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subtasks Columns */}
                                    <div className="flex gap-6">
                                        {settings.columns.map(column => {
                                            const columnTasks = subtasks.filter(t => t.status === column.status);
                                            return (
                                                <TaskColumn
                                                    key={`${pId}-${column.id}`}
                                                    column={column}
                                                    tasks={columnTasks}
                                                    settings={settings}
                                                    droppableId={`${pId}:${column.status}`}
                                                    hideHeader
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {showSettings && (
                <BoardSettingsModal
                    project={project}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
}
