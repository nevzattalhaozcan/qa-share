import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import TagInput from '../components/TagInput';
import StatusDropdown from '../components/StatusDropdown';
import api from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';

export default function CreateTask() {
    const navigate = useNavigate();
    const { activeProjectId, addTask } = useData();
    const { canCreateTasks } = usePermissions();
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!canCreateTasks) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-xl font-semibold text-red-400">Permission Denied</p>
                <p className="text-muted-foreground">You do not have permission to create tasks in this project.</p>
                <button
                    onClick={() => navigate('/tasks')}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                    Back to Tasks
                </button>
            </div>
        );
    }

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'To Do' | 'In Progress' | 'Done'>('To Do');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [tags, setTags] = useState<string[]>([]);
    const [additionalInfo, setAdditionalInfo] = useState('');

    // File upload state
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('files', file);
        });

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAttachments([...attachments, ...res.data.urls]);
        } catch (err) {
            console.error('Upload failed:', err);
            // In a real app we'd show a toast here
        } finally {
            setIsUploading(false);
            // Clear input
            e.target.value = '';
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments(attachments.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProjectId || !title.trim()) return;

        setIsSubmitting(true);
        try {
            await addTask({
                projectId: activeProjectId,
                title,
                description,
                status,
                priority,
                tags,
                additionalInfo,
                attachments,
            });
            navigate('/tasks');
        } catch (err) {
            console.error('Failed to create task:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold">New Task</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <StatusDropdown
                            currentStatus={status}
                            options={['To Do', 'In Progress', 'Done']}
                            onUpdate={(s) => setStatus(s as any)}
                            colorMap={{
                                'To Do': 'bg-slate-500/10 text-slate-400',
                                'In Progress': 'bg-blue-500/10 text-blue-500',
                                'Done': 'bg-green-500/10 text-green-500'
                            }}
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <StatusDropdown
                            currentStatus={priority}
                            options={['Low', 'Medium', 'High']}
                            onUpdate={(p) => setPriority(p as any)}
                            colorMap={{
                                'Low': 'bg-slate-500/10 text-slate-400',
                                'Medium': 'bg-blue-500/10 text-blue-500',
                                'High': 'bg-orange-500/10 text-orange-500'
                            }}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the task..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    />
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Additional Information</label>
                    <textarea
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        placeholder="Any extra details..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <TagInput tags={tags} onChange={setTags} />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Attachments</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-4 transition-colors hover:border-white/20 hover:bg-white/5">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center gap-2 cursor-pointer py-4"
                        >
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Upload size={24} />
                            </div>
                            <span className="text-sm font-medium">
                                {isUploading ? 'Uploading...' : 'Tap to upload files'}
                            </span>
                        </label>
                    </div>

                    {/* Attachment List */}
                    {attachments.length > 0 && (
                        <div className="space-y-2 mt-2">
                            {attachments.map((url, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                <img src={url} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <span className="text-xs font-mono">FILE</span>
                                            )}
                                        </div>
                                        <span className="text-sm truncate opacity-80">{url.split('/').pop()}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="p-1 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 rounded transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="w-full py-4 bg-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        'Creating...'
                    ) : (
                        <>
                            <Save size={20} />
                            Create Task
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
