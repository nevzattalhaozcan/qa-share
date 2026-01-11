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

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Update task status
        updateTask(draggableId, { status: destination.droppableId as any });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-muted-foreground transition-colors"
                >
                    <Settings2 size={16} />
                    Customize Board
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 h-full min-w-max px-1">
                        {settings.columns.map(column => {
                            const columnTasks = tasks.filter(t => t.status === column.status);
                            return (
                                <TaskColumn
                                    key={column.id}
                                    column={column}
                                    tasks={columnTasks}
                                    settings={settings}
                                />
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
