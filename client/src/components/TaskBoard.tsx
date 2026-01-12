import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useData } from '../context/DataContext';
import type { Task, Project } from '../context/DataContext';
import TaskColumn from './TaskColumn';
import { Settings2, GripVertical } from 'lucide-react';
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
            reporter: true,
        }
    };

    // Helper to get consistent ID
    const getTaskId = (t: Task) => (t as any)._id || t.id;

    // Sorting Logic: Parents first, then by order
    const sortedTasks = [...tasks].sort((a, b) => {
        const aIsParent = tasks.some(sub => sub.parentId === getTaskId(a));
        const bIsParent = tasks.some(sub => sub.parentId === getTaskId(b));
        if (aIsParent && !bIsParent) return -1;
        if (!aIsParent && bIsParent) return 1;
        return (a.order || 0) - (b.order || 0);
    });

    const parentTasks = sortedTasks.filter(t => tasks.some(sub => sub.parentId === getTaskId(t)));
    const standaloneTasks = sortedTasks.filter(t => !t.parentId && !tasks.some(sub => sub.parentId === getTaskId(t)));

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'swimlane') {
            // Reordering swimlanes
            const reorderedParents = Array.from(parentTasks);
            const [removed] = reorderedParents.splice(source.index, 1);
            reorderedParents.splice(destination.index, 0, removed);

            // Update order for all parents in this group
            reorderedParents.forEach((parent, idx) => {
                updateTask(getTaskId(parent), { order: idx });
            });
            return;
        }

        // Standard task move
        const lastColonIndex = destination.droppableId.lastIndexOf(':');
        const targetParentId = destination.droppableId.substring(0, lastColonIndex);
        const targetStatus = destination.droppableId.substring(lastColonIndex + 1);

        if (targetStatus) {
            // Determine new parentId
            let newParentId: string | null = null;
            if (targetParentId === 'standalone') {
                newParentId = null;
            } else if (targetParentId && targetParentId !== 'standalone') {
                newParentId = targetParentId;
            }

            // Get tasks in destination group (excluding the dragged one)
            const destinationTasks = sortedTasks.filter(t => {
                const tId = getTaskId(t);
                if (tId === draggableId) return false; // Exclude dragged task

                // Match parent
                const tParentId = t.parentId || null;
                const matchParent = tParentId === newParentId;

                // Match status
                const matchStatus = t.status === targetStatus;

                return matchParent && matchStatus;
            });

            // Insert dragged task at new index
            // We need the dragged task object but with updated properties to represent its new state in the list
            const draggedTask = tasks.find(t => getTaskId(t) === draggableId);
            if (!draggedTask) return;

            // Splice into the detailed array to get correct order indices
            const newOrderList = [...destinationTasks];
            newOrderList.splice(destination.index, 0, draggedTask);

            // Update all modified tasks
            newOrderList.forEach((t, index) => {
                const tId = getTaskId(t);
                const isDrivenTask = tId === draggableId;

                if (isDrivenTask) {
                    // Update dragged task with all changes
                    updateTask(tId, {
                        status: targetStatus as any,
                        parentId: newParentId as any, // Cast to any to handle null/undefined differences if types strictly assume string
                        order: index
                    });
                } else if (t.order !== index) {
                    // Only update valid neighbors if their order changed
                    updateTask(tId, { order: index });
                }
            });
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
                        {/* Headers row */}
                        <div className="flex gap-6 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-sm py-3 border-b border-white/5">
                            {settings.columns.map(column => (
                                <div key={column.id} className="flex-1 min-w-[200px] max-w-[320px] px-4">
                                    <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-widest">{column.title}</h3>
                                </div>
                            ))}
                        </div>

                        <Droppable droppableId="board-swimlanes" type="swimlane">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-10">
                                    {/* Parent Task Swimlanes */}
                                    {parentTasks.map((parent, index) => {
                                        const pId = getTaskId(parent);
                                        const subtasks = sortedTasks.filter(t => t.parentId === pId);
                                        return (
                                            <Draggable key={`swimlane-${pId}`} draggableId={`swimlane-${pId}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`flex flex-col gap-3 group/lane ${snapshot.isDragging ? 'z-50' : ''}`}
                                                    >
                                                        {/* Swimlane Header */}
                                                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/40 rounded-xl border border-white/5 w-fit hover:bg-slate-800/60 transition-colors group cursor-pointer">
                                                            <div {...provided.dragHandleProps} className="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing text-slate-600">
                                                                <GripVertical size={14} />
                                                            </div>
                                                            <div
                                                                className="flex items-center gap-3"
                                                                onClick={() => window.location.href = `#/tasks/${pId}`}
                                                            >
                                                                <div className={`w-2 h-2 rounded-full ${parent.priority === 'High' ? 'bg-orange-500' :
                                                                    parent.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-500'
                                                                    }`} />
                                                                <span className="text-xs font-mono text-primary font-bold">{parent.friendlyId || `#${pId.slice(-4)}`}</span>
                                                                <span className="text-sm font-semibold text-slate-200">{parent.title}</span>
                                                                <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
                                                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">{parent.status}</span>
                                                                    {subtasks.length > 0 && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-full text-slate-500">{subtasks.length} sub-tasks</span>
                                                                    )}
                                                                </div>
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
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}

                                    {/* Standalone Tasks Section */}
                                    {standaloneTasks.length > 0 && (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 w-fit">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Other Tasks</span>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded-full text-slate-500">{standaloneTasks.length}</span>
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
                                </div>
                            )}
                        </Droppable>
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
