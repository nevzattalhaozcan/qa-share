import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, type TestCase } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useListAutoFormat } from '../hooks/useListAutoFormat';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import LinkSelector from '../components/LinkSelector';
import StatusDropdown from '../components/StatusDropdown';
import TagInput from '../components/TagInput';
import { AnimatePresence } from 'framer-motion';
import { Link as LinkIcon } from 'lucide-react';

export default function CreateTestCase() {
    const navigate = useNavigate();
    const { addTestCase, activeProjectId, bugs, linkItems } = useData();
    const { user } = useAuth();
    const { canCreateTestCases } = usePermissions();
    const { handleKeyDown } = useListAutoFormat();

    useEffect(() => {
        if (!canCreateTestCases) {
            navigate('/tests');
        }
    }, [canCreateTestCases, navigate]);

    // Don't render the form if user doesn't have permission
    if (!canCreateTestCases) {
        return null;
    }

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        preconditions: '',
        steps: '',
        expectedResult: '',
        priority: 'Medium' as TestCase['priority'],
        status: 'Todo' as TestCase['status'],
        tags: [] as string[],
    });

    const [linkedBugIds, setLinkedBugIds] = useState<string[]>([]);
    const [showLinkSelector, setShowLinkSelector] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Track if any field has been filled
    useEffect(() => {
        const hasContent = formData.title || formData.description || formData.preconditions || 
                          formData.steps || formData.expectedResult || formData.tags.length > 0;
        setHasUnsavedChanges(hasContent);
    }, [formData]);

    const { blocker, proceedNavigation, resetNavigation } = useUnsavedChanges({
        hasUnsavedChanges,
        onNavigateAway: () => setShowDraftModal(true),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !activeProjectId) {
            setShowErrorModal(true);
            return;
        }

        // Validate required fields for non-draft status
        if (!formData.title || !formData.steps || !formData.expectedResult) {
            alert('Please fill in all required fields: Title, Steps, and Expected Result');
            return;
        }

        setHasUnsavedChanges(false);
        const newTestCase = await addTestCase({
            ...formData,
            linkedBugIds: linkedBugIds,
            projectId: activeProjectId,
        });

        if (newTestCase) {
            navigate('/tests');
        }
    };

    const handleSaveAsDraft = async () => {
        if (!user || !activeProjectId) {
            setShowErrorModal(true);
            return;
        }

        const newTestCase = await addTestCase({
            ...formData,
            status: 'Draft',
            linkedBugIds: linkedBugIds,
            projectId: activeProjectId,
        });

        setHasUnsavedChanges(false);
        setShowDraftModal(false);
        navigate('/tests');
    };

    const handleDiscard = () => {
        setHasUnsavedChanges(false);
        setShowDraftModal(false);
        navigate('/tests');
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold">Create Test Case</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Verify Login Flow"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the test case"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <StatusDropdown
                            currentStatus={formData.priority}
                            options={['Low', 'Medium', 'High']}
                            onUpdate={(priority) => setFormData({ ...formData, priority: priority as TestCase['priority'] })}
                            colorMap={{
                                'Low': 'bg-green-500/10 text-green-500',
                                'Medium': 'bg-yellow-500/10 text-yellow-500',
                                'High': 'bg-red-500/10 text-red-500'
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <StatusDropdown
                            currentStatus={formData.status}
                            options={['Draft', 'Todo', 'In Progress', 'Pass', 'Fail']}
                            onUpdate={(status) => setFormData({ ...formData, status: status as TestCase['status'] })}
                            colorMap={{
                                'Draft': 'bg-gray-500/10 text-gray-400',
                                'Todo': 'bg-blue-500/10 text-blue-400',
                                'In Progress': 'bg-yellow-500/10 text-yellow-500',
                                'Pass': 'bg-green-500/10 text-green-500',
                                'Fail': 'bg-red-500/10 text-red-500'
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Preconditions</label>
                    <Textarea
                        value={formData.preconditions}
                        onChange={e => setFormData({ ...formData, preconditions: e.target.value })}
                        placeholder="e.g. User is logged out"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Steps</label>
                    <Textarea
                        required
                        className="min-h-[120px]"
                        value={formData.steps}
                        onChange={e => setFormData({ ...formData, steps: e.target.value })}
                        onKeyDown={e => handleKeyDown(e, formData.steps, (v) => setFormData({ ...formData, steps: v }))}
                        placeholder="1. Go to login page&#10;2. Enter credentials&#10;3. Click submit"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Result</label>
                    <Textarea
                        required
                        value={formData.expectedResult}
                        onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
                        placeholder="User should be redirected to dashboard"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <TagInput
                        tags={formData.tags}
                        onChange={tags => setFormData({ ...formData, tags })}
                        placeholder="e.g. login, authentication, smoke"
                    />
                </div>

                {/* Link Bugs */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Linked Bugs (Optional)</label>
                    <div className="space-y-2">
                        {linkedBugIds.map(bugId => {
                            const bug = bugs.find(b => b.id === bugId || (b as any)._id === bugId);
                            const bugKey = bug ? ((bug as any)._id || bug.id) : bugId;
                            return bug ? (
                                <div key={bugKey} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                    <span className="text-sm truncate">{bug.friendlyId} - {bug.title}</span>
                                    <button
                                        type="button"
                                        onClick={() => setLinkedBugIds(linkedBugIds.filter(id => id !== bugId))}
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
                            Link Bug
                        </Button>
                    </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg">
                    Create Test Case
                </Button>
            </form>

            <AnimatePresence>
                {showLinkSelector && (
                    <LinkSelector
                        type="bug"
                        onSelect={(bugId) => {
                            if (!linkedBugIds.includes(bugId)) {
                                setLinkedBugIds([...linkedBugIds, bugId]);
                            }
                            setShowLinkSelector(false);
                        }}
                        onClose={() => setShowLinkSelector(false)}
                        excludeIds={linkedBugIds}
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
                confirmText="Save as Draft"
                cancelText="Discard"
            />
        </div>
    );
}
