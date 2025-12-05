import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData, type TestCase } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { usePermissions } from '../hooks/usePermissions';
import { useListAutoFormat } from '../hooks/useListAutoFormat';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Modal } from '../components/ui/Modal';
import StatusDropdown from '../components/StatusDropdown';
import TagInput from '../components/TagInput';
import { ArrowLeft } from 'lucide-react';

export default function EditTestCase() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { testCases, updateTestCase } = useData();
    const { canEditTestCases } = usePermissions();
    const { handleKeyDown } = useListAutoFormat();

    const testCase = testCases.find(t => t.id === id || (t as any)._id === id);

    useEffect(() => {
        if (!canEditTestCases || !testCase) {
            navigate('/tests');
        }
    }, [canEditTestCases, testCase, navigate]);

    const [formData, setFormData] = useState({
        title: testCase?.title || '',
        description: testCase?.description || '',
        preconditions: testCase?.preconditions || '',
        steps: testCase?.steps || '',
        expectedResult: testCase?.expectedResult || '',
        priority: (testCase?.priority || 'Medium') as TestCase['priority'],
        status: (testCase?.status || 'Todo') as TestCase['status'],
        tags: testCase?.tags || [] as string[],
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Track changes
    useEffect(() => {
        if (!testCase) return;
        const hasChanged =
            formData.title !== (testCase.title || '') ||
            formData.description !== (testCase.description || '') ||
            formData.preconditions !== (testCase.preconditions || '') ||
            formData.steps !== (testCase.steps || '') ||
            formData.expectedResult !== (testCase.expectedResult || '') ||
            formData.priority !== testCase.priority ||
            formData.status !== testCase.status ||
            JSON.stringify(formData.tags) !== JSON.stringify(testCase.tags || []);
        setHasUnsavedChanges(hasChanged);
    }, [formData, testCase]);

    const { blocker, proceedNavigation, resetNavigation } = useUnsavedChanges({
        hasUnsavedChanges,
        onNavigateAway: () => setShowSaveModal(true),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id) {
            // Validate required fields if changing from Draft to another status
            if (testCase?.status === 'Draft' && formData.status !== 'Draft') {
                if (!formData.title || !formData.steps || !formData.expectedResult) {
                    alert('Please fill in all required fields before changing status: Title, Steps, and Expected Result');
                    return;
                }
            }
            setHasUnsavedChanges(false);
            updateTestCase(id, formData);
            navigate(`/tests/${id}`);
        }
    };

    const handleSave = () => {
        if (id) {
            updateTestCase(id, formData);
            setHasUnsavedChanges(false);
            setShowSaveModal(false);
        }
    };

    const handleDiscard = () => {
        setHasUnsavedChanges(false);
        setShowSaveModal(false);
    };

    if (!testCase) {
        return null;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/tests/${id}`)}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-2xl font-bold">Edit Test Case</h1>
            </div>

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

                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(`/tests/${id}`)}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
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
            >
                <p className="text-gray-600 mb-6">
                    You have unsaved changes. Would you like to save them before leaving?
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleDiscard}
                    >
                        Discard
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
