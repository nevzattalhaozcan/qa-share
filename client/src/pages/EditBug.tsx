import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData, type Bug } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { usePermissions } from '../hooks/usePermissions';
import { useListAutoFormat } from '../hooks/useListAutoFormat';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Modal } from '../components/ui/Modal';
import StatusDropdown from '../components/StatusDropdown';
import TagInput from '../components/TagInput';
import { ArrowLeft, Image, X } from 'lucide-react';
import { uploadFile, deleteFile } from '../lib/api';

export default function EditBug() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { bugs, updateBug } = useData();
    const { canEditBugs } = usePermissions();
    const { handleKeyDown } = useListAutoFormat();

    const bug = bugs.find(b => b.id === id || (b as any)._id === id);

    useEffect(() => {
        if (!canEditBugs || !bug) {
            navigate('/bugs');
        }
    }, [canEditBugs, bug, navigate]);

    const [formData, setFormData] = useState({
        title: bug?.title || '',
        description: bug?.description || '',
        stepsToReproduce: bug?.stepsToReproduce || '',
        testData: bug?.testData || '',
        expectedResult: bug?.expectedResult || '',
        actualResult: bug?.actualResult || '',
        severity: (bug?.severity || 'Medium') as Bug['severity'],
        status: (bug?.status || 'Opened') as Bug['status'],
        tags: bug?.tags || [] as string[],
        attachments: bug?.attachments || [] as string[],
    });
    const [isUploading, setIsUploading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Track changes
    useEffect(() => {
        if (!bug) return;
        const hasChanged =
            formData.title !== (bug.title || '') ||
            formData.description !== (bug.description || '') ||
            formData.stepsToReproduce !== (bug.stepsToReproduce || '') ||
            formData.testData !== (bug.testData || '') ||
            formData.expectedResult !== (bug.expectedResult || '') ||
            formData.actualResult !== (bug.actualResult || '') ||
            formData.severity !== bug.severity ||
            JSON.stringify(formData.tags) !== JSON.stringify(bug.tags || []) ||
            JSON.stringify(formData.attachments) !== JSON.stringify(bug.attachments || []);
        setHasUnsavedChanges(hasChanged);
    }, [formData, bug]);

    const { resetNavigation } = useUnsavedChanges({
        hasUnsavedChanges,
        onNavigateAway: () => setShowSaveModal(true),
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            setIsUploading(true);
            try {
                const result = await uploadFile(file);
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, result.url]
                }));
            } catch (error) {
                console.error('Upload failed:', error);
                alert('Failed to upload file. Please try again.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const removeAttachment = async (index: number, url: string) => {
        try {
            // Only delete from Firebase if it's not a blob URL
            if (!url.startsWith('blob:')) {
                await deleteFile(url);
            }
            setFormData(prev => ({
                ...prev,
                attachments: prev.attachments.filter((_, i) => i !== index)
            }));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id) {
            // Validate required fields if changing from Draft to another status
            if (bug?.status === 'Draft' && formData.status !== 'Draft') {
                if (!formData.title || !formData.stepsToReproduce) {
                    alert('Please fill in all required fields before changing status: Title and Steps to Reproduce');
                    return;
                }
            }
            updateBug(id, formData);
            setHasUnsavedChanges(false);
            resetNavigation();
            navigate(`/bugs/${id}`);
        }
    };

    const handleSave = () => {
        if (id) {
            updateBug(id, formData);
            setHasUnsavedChanges(false);
            setShowSaveModal(false);
        }
    };

    const handleDiscard = () => {
        setHasUnsavedChanges(false);
        setShowSaveModal(false);
    };

    if (!bug) {
        return null;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/bugs/${id}`)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-2xl font-bold">Edit Bug</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. App crashes on login"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    <StatusDropdown
                        currentStatus={formData.severity}
                        options={['Low', 'Medium', 'High', 'Critical']}
                        onUpdate={(severity) => setFormData({ ...formData, severity: severity as Bug['severity'] })}
                        colorMap={{
                            'Low': 'bg-green-500/10 text-green-500',
                            'Medium': 'bg-yellow-500/10 text-yellow-500',
                            'High': 'bg-orange-500/10 text-orange-500',
                            'Critical': 'bg-red-500/10 text-red-500'
                        }}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the bug"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Steps to Reproduce</label>
                    <Textarea
                        required
                        className="min-h-[120px]"
                        value={formData.stepsToReproduce}
                        onChange={e => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                        onKeyDown={e => handleKeyDown(e, formData.stepsToReproduce, (v) => setFormData({ ...formData, stepsToReproduce: v }))}
                        placeholder="1. Open app&#10;2. Click button&#10;3. Observe crash"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Test Data</label>
                    <Textarea
                        value={formData.testData}
                        onChange={e => setFormData({ ...formData, testData: e.target.value })}
                        placeholder="Credentials, URLs, or data needed to reproduce"
                        className="font-mono text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Result</label>
                    <Textarea
                        value={formData.expectedResult}
                        onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
                        placeholder="What should have happened"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Actual Result</label>
                    <Textarea
                        value={formData.actualResult}
                        onChange={e => setFormData({ ...formData, actualResult: e.target.value })}
                        placeholder="What actually happened"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <TagInput
                        tags={formData.tags}
                        onChange={tags => setFormData({ ...formData, tags })}
                        placeholder="e.g. ui, crash, regression"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments (Screenshots/Videos)</label>
                    <div className="grid grid-cols-3 gap-4">
                        {formData.attachments.filter(url => url && !url.startsWith('blob:')).map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index, url)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="text-center">
                                {isUploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                                        <span className="text-xs text-muted-foreground">Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Image size={24} className="mx-auto mb-2 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Add Image</span>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(`/bugs/${id}`)}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-red-500 hover:bg-red-600">
                        Save Changes
                    </Button>
                </div>
            </form>

            <Modal
                isOpen={showSaveModal}
                onClose={() => {
                    setShowSaveModal(false);
                    resetNavigation();
                }}
                title="Unsaved Changes"
                message="You have unsaved changes. Would you like to save them before leaving?"
                type="warning"
                onConfirm={handleSave}
                onCancel={handleDiscard}
                confirmText="Save"
                cancelText="Discard"
            />
        </div>
    );
}
