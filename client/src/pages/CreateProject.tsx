import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft } from 'lucide-react';

export default function CreateProject() {
    const navigate = useNavigate();
    const { addProject } = useData();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !user) return;

        const userId = (user as any)._id || user.id;

        // Create owner member from current user
        const ownerMember = {
            id: userId,
            name: user.name,
            username: user.username,
            password: user.password,
            role: user.role as 'QA' | 'DEV'
        };

        addProject({
            name: name.trim(),
            description: description.trim(),
            createdBy: userId,
            members: [ownerMember],
            permissions: {
                devCanViewTestCases: true,
                devCanCreateTestCases: false,
                devCanEditTestCases: false,
                devCanViewBugs: true,
                devCanCreateBugs: true,
                devCanEditBugs: false,
                devCanEditBugStatusOnly: true,
                devCanViewNotes: false,
                devCanViewTasks: true,
                devCanCreateTasks: false,
                devCanEditTasks: false
            }
        });

        navigate('/');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-xl font-bold">Create New Project</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="glass-card p-6 rounded-2xl space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Project Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Mobile App QA"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the project scope..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/')}>
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={!name.trim()}>
                        Create Project
                    </Button>
                </div>
            </form>
        </div>
    );
}
