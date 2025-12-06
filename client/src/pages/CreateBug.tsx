import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, type Bug } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { Image, X, Link as LinkIcon } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useListAutoFormat } from '../hooks/useListAutoFormat';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { uploadFile } from '../lib/api';
import LinkSelector from '../components/LinkSelector';
import StatusDropdown from '../components/StatusDropdown';
import TagInput from '../components/TagInput';
import { AnimatePresence } from 'framer-motion';

export default function CreateBug() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addBug, activeProjectId, testCases } = useData();
    const { user } = useAuth();
    const { canCreateBugs, canEditTestCases } = usePermissions();
    const { handleKeyDown } = useListAutoFormat();

    useEffect(() => {
        if (!canCreateBugs) {
            navigate('/bugs');
        }
    }, [canCreateBugs, navigate]);

    // Don't render the form if user doesn't have permission
    if (!canCreateBugs) {
        return null;
    }

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        severity: 'Medium' as Bug['severity'],
        status: 'Opened' as Bug['status'],
        attachments: [] as string[],
        tags: [] as string[],
    });

    const [linkedTestIds, setLinkedTestIds] = useState<string[]>(
        location.state?.linkedTestCaseId ? [location.state.linkedTestCaseId] : []
    );
    const [showLinkSelector, setShowLinkSelector] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Track if any field has been filled
    useEffect(() => {
        const hasContent = !!(formData.title || formData.description || formData.stepsToReproduce ||
            formData.expectedResult || formData.actualResult ||
            formData.tags.length > 0 || formData.attachments.length > 0);
        setHasUnsavedChanges(hasContent);
    }, [formData]);

    // Use unsaved changes hook
    const { resetNavigation } = useUnsavedChanges({
        hasUnsavedChanges,
        onNavigateAway: () => setShowDraftModal(true),
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            setIsUploading(true);
            try {
                // Upload to Firebase Storage
                const result = await uploadFile(file);

                // Add the Firebase URL to attachments
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

    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activeProjectId) {
            setShowErrorModal(true);
            return;
        }

        // Validate required fields for non-draft status
        if (!formData.title || !formData.stepsToReproduce) {
            alert('Please fill in all required fields: Title and Steps to Reproduce');
            return;
        }

        setHasUnsavedChanges(false);
        const newBug = await addBug({
            ...formData,
            linkedTestCaseIds: linkedTestIds,
            projectId: activeProjectId,
        });

        if (newBug) {
            if (location.state?.returnTo) {
                navigate(location.state.returnTo.pathname + location.state.returnTo.search, {
                    state: location.state.returnTo.state
                });
            } else {
                navigate('/bugs');
            }
        }
    };

    const handleSaveAsDraft = async () => {
        if (!user || !activeProjectId) {
            setShowErrorModal(true);
            return;
        }

        await addBug({
            ...formData,
            status: 'Draft',
            linkedTestCaseIds: linkedTestIds,
            projectId: activeProjectId,
        });

        setHasUnsavedChanges(false);
        setShowDraftModal(false);
        setHasUnsavedChanges(false);
        setShowDraftModal(false);
        if (location.state?.returnTo) {
            navigate(location.state.returnTo.pathname + location.state.returnTo.search, {
                state: location.state.returnTo.state
            });
        } else {
            navigate('/bugs');
        }
    };

    const handleDiscard = () => {
        setHasUnsavedChanges(false);
        setShowDraftModal(false);
        if (location.state?.returnTo) {
            navigate(location.state.returnTo.pathname + location.state.returnTo.search, {
                state: location.state.returnTo.state
            });
        } else {
            navigate('/bugs');
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">Report Bug</h1>

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
                    <label className="text-sm font-medium">Attachments (Screenshots/Videos)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {formData.attachments.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(index)}
                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
                            {isUploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                                    <span className="text-xs text-muted-foreground">Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Image size={24} className="text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Add Media</span>
                                </>
                            )}
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

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <TagInput
                        tags={formData.tags}
                        onChange={tags => setFormData({ ...formData, tags })}
                        placeholder="e.g. ui, crash, regression"
                    />
                </div>

                {/* Link Test Cases */}
                {canEditTestCases && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Linked Test Cases (Optional)</label>
                        <div className="space-y-2">
                            {linkedTestIds.map(testId => {
                                const test = testCases.find(t => t.id === testId || (t as any)._id === testId);
                                const testKey = test ? ((test as any)._id || test.id) : testId;
                                return test ? (
                                    <div key={testKey} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                        <span className="text-sm truncate">{test.friendlyId} - {test.title}</span>
                                        <button
                                            type="button"
                                            onClick={() => setLinkedTestIds(linkedTestIds.filter(id => id !== testId))}
                                            className="text-red-400 hover:text-red-300 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : null;
                            })}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowLinkSelector(true)}
                                className="w-full"
                            >
                                <LinkIcon size={16} className="mr-2" />
                                Link Test Case
                            </Button>
                        </div>
                    </div>
                )}

                <Button type="submit" className="w-full h-14 text-lg bg-red-500 hover:bg-red-600">
                    Report Bug
                </Button>
            </form>

            <AnimatePresence>
                {showLinkSelector && (
                    <LinkSelector
                        type="test"
                        onSelect={(testId) => {
                            if (!linkedTestIds.includes(testId)) {
                                setLinkedTestIds([...linkedTestIds, testId]);
                            }
                            setShowLinkSelector(false);
                        }}
                        onClose={() => setShowLinkSelector(false)}
                        excludeIds={linkedTestIds}
                    />
                )}
            </AnimatePresence>

            <Modal
                isOpen={showErrorModal}
                onClose={() => {
                    setShowErrorModal(false);
                    navigate('/');
                }}
                title="Error"
                message="Please select a project first"
                type="error"
                confirmText="OK"
            />

            <Modal
                isOpen={showDraftModal}
                onClose={() => {
                    setShowDraftModal(false);
                    resetNavigation();
                }}
                title="Unsaved Changes"
                message="You have unsaved changes. Would you like to save this as a draft before leaving?"
                type="warning"
                onConfirm={handleSaveAsDraft}
                onCancel={handleDiscard}
                confirmText="Save as Draft"
                cancelText="Discard"
            />
        </div>
    );
}
