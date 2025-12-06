import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Edit, Link as LinkIcon, Bug as BugIcon, Trash2, X, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';
import LinkSelector from '../components/LinkSelector';
import StatusDropdown from '../components/StatusDropdown';
import { AnimatePresence } from 'framer-motion';
import { formatListText } from '../lib/utils';
import { getTestRuns } from '../lib/api';

interface TestRun {
    _id: string;
    runId: string;
    status: 'Pass' | 'Fail';
    runDateTime: string;
    executedBy: {
        name: string;
        username: string;
    };
}

export default function TestCaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { testCases, bugs, linkItems, unlinkItems, deleteTestCase, updateTestCaseStatus, activeProjectId } = useData();
    const { canEditTestCases } = usePermissions();
    const { user } = useAuth();
    const [showLinkSelector, setShowLinkSelector] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [testRuns, setTestRuns] = useState<TestRun[]>([]);

    const testCase = testCases.find(t => t.id === id || (t as any)._id === id);

    // Calculate Next/Previous Test Cases
    const sortedTestCases = testCases
        .filter(t => String(t.projectId) === String(activeProjectId))
        .sort((a, b) => (a.friendlyId || '').localeCompare(b.friendlyId || '', undefined, { numeric: true }));

    const currentIndex = sortedTestCases.findIndex(t => t.id === id || (t as any)._id === id);
    const prevTestCase = currentIndex > 0 ? sortedTestCases[currentIndex - 1] : null;
    const nextTestCase = currentIndex !== -1 && currentIndex < sortedTestCases.length - 1 ? sortedTestCases[currentIndex + 1] : null;

    useEffect(() => {
        const fetchTestRuns = async () => {
            if (!testCase) return;
            const tcId = (testCase as any)._id || testCase.id;
            try {
                const runs = await getTestRuns(tcId);
                setTestRuns(runs);
            } catch (error) {
                console.error('Error fetching test runs:', error);
            }
        };

        fetchTestRuns();
    }, [testCase?.id, (testCase as any)?._id]);

    if (!testCase) {
        return (
            <div className="p-4 text-center">
                <p>Test case not found</p>
                <Button variant="link" onClick={() => navigate('/tests')}>Back to list</Button>
            </div>
        );
    }

    const linkedBugs = bugs.filter(b => {
        const bugId = (b as any)._id || b.id;
        return testCase.linkedBugIds?.some(linkedId =>
            String(linkedId) === String(bugId)
        );
    });

    const navigateToTest = (testId: string) => {
        navigate(`/tests/${testId}`, { state: { from: location.state?.from } });
    };

    return (
        <div className="space-y-4 pb-20">
            {/* Header */}
            <div className="glass-card p-4 rounded-2xl">
                {/* Top Row - Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                            if (location.state?.from) {
                                navigate(location.state.from.pathname + location.state.from.search);
                            } else {
                                navigate('/tests');
                            }
                        }} title="Back to List">
                            <ArrowLeft size={24} />
                        </Button>
                        <div className="h-6 w-px bg-white/10 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => prevTestCase && navigateToTest((prevTestCase as any)._id || prevTestCase.id)}
                            disabled={!prevTestCase}
                            title={prevTestCase ? `Previous: ${prevTestCase.friendlyId || 'Test'}` : 'No previous test'}
                            className={!prevTestCase ? 'opacity-30' : ''}
                        >
                            <ChevronLeft size={24} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => nextTestCase && navigateToTest((nextTestCase as any)._id || nextTestCase.id)}
                            disabled={!nextTestCase}
                            title={nextTestCase ? `Next: ${nextTestCase.friendlyId || 'Test'}` : 'No next test'}
                            className={!nextTestCase ? 'opacity-30' : ''}
                        >
                            <ChevronRight size={24} />
                        </Button>
                    </div>

                    {canEditTestCases && (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => {
                                const tcId = (testCase as any)._id || testCase.id;
                                navigate(`/tests/${tcId}/edit`);
                            }}>
                                <Edit size={20} />
                            </Button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                                title="Delete test case"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Middle - ID and Title */}
                <div className="space-y-2 mb-4">
                    {testCase.friendlyId && (
                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded inline-block">
                            {testCase.friendlyId}
                        </span>
                    )}
                    <h1 className="text-2xl font-bold break-words leading-tight">{testCase.title}</h1>
                </div>

                {/* Bottom Row - Priority and Status */}
                <div className="flex items-center justify-between">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${testCase.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        testCase.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                        {testCase.priority} Priority
                    </span>
                    <div className="flex items-center gap-2">
                        {canEditTestCases ? (
                            <StatusDropdown
                                currentStatus={testCase.status}
                                options={['Draft', 'Todo', 'In Progress', 'Pass', 'Fail']}
                                onUpdate={async (status) => {
                                    const tcId = (testCase as any)._id || testCase.id;
                                    if (status === 'Fail') {
                                        await updateTestCaseStatus(tcId, 'Fail');
                                        navigate('/bugs/create', {
                                            state: {
                                                linkedTestCaseId: tcId,
                                                returnTo: location
                                            }
                                        });
                                    } else {
                                        updateTestCaseStatus(tcId, status as any);
                                    }
                                }}
                                colorMap={{
                                    'Pass': 'bg-green-500/20 text-green-400',
                                    'Fail': 'bg-red-500/20 text-red-400',
                                    'In Progress': 'bg-blue-500/20 text-blue-400',
                                    'Draft': 'bg-gray-500/20 text-gray-400',
                                    'Todo': 'bg-slate-500/20 text-slate-400'
                                }}
                            />
                        ) : (
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${testCase.status === 'Pass' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                testCase.status === 'Fail' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    testCase.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                        testCase.status === 'Draft' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                            'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                }`}>
                                {testCase.status}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="glass-card p-6 rounded-2xl space-y-6">
                {testCase.tags && testCase.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-white/5">
                        {testCase.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Description</h3>
                    <p className="text-base leading-relaxed">{testCase.description || 'No description provided.'}</p>
                </div>

                {testCase.preconditions && (
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Preconditions</h3>
                        <div className="bg-blue-500/5 p-5 rounded-xl border border-blue-500/20">
                            <p className="whitespace-pre-wrap leading-relaxed">{testCase.preconditions}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Steps</h3>
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-white/10">
                        <div
                            className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatListText(testCase.steps) }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-green-400 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Expected Result
                    </h3>
                    <div className="bg-green-500/5 p-5 rounded-xl border border-green-500/20">
                        <p className="whitespace-pre-wrap leading-relaxed">{testCase.expectedResult}</p>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider flex items-center gap-2">
                            <BugIcon size={14} />
                            Linked Bugs
                        </h3>
                        {canEditTestCases && (
                            <Button variant="ghost" size="sm" onClick={() => setShowLinkSelector(true)} className="h-8 text-xs">
                                <LinkIcon size={12} className="mr-1" /> Link Bug
                            </Button>
                        )}
                    </div>

                    {linkedBugs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No linked bugs.</p>
                    ) : (
                        <div className="space-y-2">
                            {linkedBugs.map(bug => {
                                const bugLinkId = (bug as any)._id || bug.id;
                                const testCaseId = (testCase as any)._id || testCase.id;
                                const canUnlinkBug = user?.role === 'QA' || bug.createdBy === user?.id;

                                return (
                                    <div key={bugLinkId} className="relative group">
                                        <Link to={`/bugs/${bugLinkId}`} className="block bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/5 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                    {bug.friendlyId || 'BUG'}
                                                </span>
                                                {canEditTestCases && canUnlinkBug && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            unlinkItems('test', testCaseId, 'bug', bugLinkId);
                                                        }}
                                                        className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-500 transition-all z-10"
                                                        title="Unlink bug"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium truncate">{bug.title}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${bug.status === 'Fixed' || bug.status === 'Closed' ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'
                                                    }`}>
                                                    {bug.status}
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Test Run History */}
            {
                testRuns.length > 0 && (
                    <div className="glass-card p-6 rounded-2xl">
                        <h3 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider flex items-center gap-2 mb-4">
                            <PlayCircle size={14} />
                            Test Run History
                        </h3>
                        <div className="space-y-2">
                            {testRuns.map((run) => (
                                <div
                                    key={run._id}
                                    className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                                            {run.runId}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${run.status === 'Pass'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {run.status}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(run.runDateTime).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            <AnimatePresence>
                {showLinkSelector && (
                    <LinkSelector
                        type="bug"
                        projectId={testCase.projectId}
                        onSelect={(bugId) => {
                            const testCaseId = (testCase as any)._id || testCase.id;
                            linkItems('test', testCaseId, 'bug', bugId);
                            setShowLinkSelector(false);
                        }}
                        onClose={() => setShowLinkSelector(false)}
                        excludeIds={testCase.linkedBugIds}
                    />
                )}
            </AnimatePresence>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Test Case"
                message="Are you sure you want to delete this test case? This action cannot be undone."
                type="confirm"
                onConfirm={() => {
                    const tcId = (testCase as any)._id || testCase.id;
                    deleteTestCase(tcId);
                    navigate('/tests');
                }}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div >
    );
}
