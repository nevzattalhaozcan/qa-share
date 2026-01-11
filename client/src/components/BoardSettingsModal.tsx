import { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Project, TaskBoardSettings } from '../context/DataContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface BoardSettingsModalProps {
    project: Project;
    onClose: () => void;
}

export default function BoardSettingsModal({ project, onClose }: BoardSettingsModalProps) {
    const { updateBoardSettings } = useData();
    const [settings, setSettings] = useState<TaskBoardSettings>(project.taskBoardSettings || {
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
    });

    const handleSave = () => {
        const pId = (project as any)._id || project.id;
        updateBoardSettings(pId, settings);
        onClose();
    };

    const addColumn = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setSettings({
            ...settings,
            columns: [...settings.columns, { id, title: 'New Column', status: 'To Do' }]
        });
    };

    const removeColumn = (id: string) => {
        setSettings({
            ...settings,
            columns: settings.columns.filter(col => col.id !== id)
        });
    };

    const updateColumn = (id: string, updates: any) => {
        setSettings({
            ...settings,
            columns: settings.columns.map(col => col.id === id ? { ...col, ...updates } : col)
        });
    };

    const toggleField = (field: keyof TaskBoardSettings['visibleFields']) => {
        setSettings({
            ...settings,
            visibleFields: {
                ...settings.visibleFields,
                [field]: !settings.visibleFields[field]
            }
        });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Board Customization"
            className="sm:max-w-2xl"
        >
            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Columns</h3>
                        <Button variant="ghost" size="sm" onClick={addColumn} className="gap-2">
                            <Plus size={16} /> Add Column
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {settings.columns.map((column) => (
                            <div key={column.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                <GripVertical size={16} className="text-muted-foreground cursor-grab" />
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                    <input
                                        type="text"
                                        value={column.title}
                                        onChange={(e) => updateColumn(column.id, { title: e.target.value })}
                                        className="bg-transparent border-none p-0 text-sm focus:ring-0 font-medium"
                                        placeholder="Column Title"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground uppercase shrink-0">Status:</span>
                                        <select
                                            value={column.status}
                                            onChange={(e) => updateColumn(column.id, { status: e.target.value })}
                                            className="bg-transparent border-none p-0 text-sm focus:ring-0 text-primary cursor-pointer w-full"
                                        >
                                            <option value="Backlog">Backlog</option>
                                            <option value="To Do">To Do</option>
                                            <option value="In Progress">Doing</option>
                                            <option value="Done">Done</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeColumn(column.id)}
                                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Card Content</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <span className="text-sm font-medium">Show Priority</span>
                            <input
                                type="checkbox"
                                checked={settings.visibleFields.priority}
                                onChange={() => toggleField('priority')}
                                className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                            />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <span className="text-sm font-medium">Show Tags</span>
                            <input
                                type="checkbox"
                                checked={settings.visibleFields.tags}
                                onChange={() => toggleField('tags')}
                                className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
}
