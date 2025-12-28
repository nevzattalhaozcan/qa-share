import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData, type ProjectPermissions } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Shield, Trash2 } from 'lucide-react';

export default function ProjectSettings() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { projects, updateProjectPermissions, deleteProject } = useData();
    const { user } = useAuth();

    const project = projects.find(p => {
        const pId = (p as any)._id || p.id;
        return String(pId) === String(id);
    });

    // Default permissions if not set
    const defaultPermissions: ProjectPermissions = {
        devCanViewTestCases: true,
        devCanCreateTestCases: false,
        devCanEditTestCases: false,
        devCanViewBugs: true,
        devCanCreateBugs: false,
        devCanEditBugs: false,
        devCanEditBugStatusOnly: true,
        // Duplicate removed
        devCanViewNotes: false,
        devCanViewTasks: true,
        devCanCreateTasks: false,
        devCanEditTasks: false,
    };

    const [permissions, setPermissions] = useState<ProjectPermissions>(
        project?.permissions || defaultPermissions
    );
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (project && project.permissions) {
            setPermissions(project.permissions);
        } else if (project && !project.permissions) {
            // Update project with default permissions if missing
            setPermissions(defaultPermissions);
        }
    }, [project]);

    if (!project) {
        return (
            <div className="p-4">
                <p>Project not found</p>
                <Button onClick={() => navigate('/')} className="mt-4">Go Back</Button>
            </div>
        );
    }

    if (user?.role !== 'QA') {
        navigate('/');
        return null;
    }

    const handleSave = () => {
        const pId = (project as any)._id || project.id;
        updateProjectPermissions(pId, permissions);
        navigate('/');
    };

    const handleDeleteConfirm = () => {
        const pId = (project as any)._id || project.id;
        deleteProject(pId);
        navigate('/');
    };

    const togglePermission = (key: keyof ProjectPermissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft size={24} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{project.name}</h1>
                    <p className="text-sm text-muted-foreground">Developer Permissions</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    title="Delete Project"
                >
                    <Trash2 size={20} />
                </Button>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Project"
                message={`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`}
                type="confirm"
                onConfirm={handleDeleteConfirm}
                confirmText="Delete"
                cancelText="Cancel"
            />

            <div className="glass-card p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <Shield className="text-primary" size={24} />
                    <div>
                        <h3 className="font-semibold">Access Control</h3>
                        <p className="text-xs text-muted-foreground">Configure what developers can do in this project</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-3">Test Cases</h4>
                        <div className="space-y-2">
                            <PermissionToggle
                                label="View Test Cases"
                                checked={permissions.devCanViewTestCases}
                                onChange={() => togglePermission('devCanViewTestCases')}
                            />
                            <PermissionToggle
                                label="Create Test Cases"
                                checked={permissions.devCanCreateTestCases}
                                onChange={() => togglePermission('devCanCreateTestCases')}
                            />
                            <PermissionToggle
                                label="Edit Test Cases"
                                checked={permissions.devCanEditTestCases}
                                onChange={() => togglePermission('devCanEditTestCases')}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <h4 className="font-medium mb-3">Bugs</h4>
                        <div className="space-y-2">
                            <PermissionToggle
                                label="View Bugs"
                                checked={permissions.devCanViewBugs}
                                onChange={() => togglePermission('devCanViewBugs')}
                            />
                            <PermissionToggle
                                label="Create Bugs"
                                checked={permissions.devCanCreateBugs}
                                onChange={() => togglePermission('devCanCreateBugs')}
                            />
                            <PermissionToggle
                                label="Edit Bugs (Full)"
                                checked={permissions.devCanEditBugs}
                                onChange={() => togglePermission('devCanEditBugs')}
                            />
                            <PermissionToggle
                                label="Edit Bug Status Only"
                                checked={permissions.devCanEditBugStatusOnly}
                                onChange={() => togglePermission('devCanEditBugStatusOnly')}
                                description="Allows changing status without editing other fields"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <h4 className="font-medium mb-3">Tasks</h4>
                        <div className="space-y-2">
                            <PermissionToggle
                                label="View Tasks"
                                checked={permissions.devCanViewTasks}
                                onChange={() => togglePermission('devCanViewTasks')}
                            />
                            <PermissionToggle
                                label="Create Tasks"
                                checked={permissions.devCanCreateTasks}
                                onChange={() => togglePermission('devCanCreateTasks')}
                            />
                            <PermissionToggle
                                label="Edit Tasks"
                                checked={permissions.devCanEditTasks}
                                onChange={() => togglePermission('devCanEditTasks')}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <h4 className="font-medium mb-3">Other</h4>
                        <div className="space-y-2">
                            <PermissionToggle
                                label="View Notes / Test Accounts"
                                checked={permissions.devCanViewNotes}
                                onChange={() => togglePermission('devCanViewNotes')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                    Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                    Save Permissions
                </Button>
            </div>
        </div>
    );
}

function PermissionToggle({
    label,
    checked,
    onChange,
    description
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
    description?: string;
}) {
    return (
        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className="flex-1">
                <div className="font-medium text-sm">{label}</div>
                {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-700'
                    }`}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </label>
    );
}
