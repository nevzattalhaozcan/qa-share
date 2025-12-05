import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Plus, Users, Bug, ListTodo, Settings, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
    const { projects, activeProjectId, setActiveProjectId, testCases, bugs } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    const userId = user ? ((user as any)._id || user.id) : null;
    const userProjects = projects.filter(p => {
        const creatorId = String(p.createdBy);
        return creatorId === String(userId) || p.members.some(m => {
            const memberId = (m as any)._id || m.id;
            return String(memberId) === String(userId);
        });
    });

    // Helper to get project ID (MongoDB returns _id, but we might have id too)
    const getProjectId = (project: typeof projects[0]) => (project as any)._id || project.id;

    const getProjectStats = (projectId: string) => {
        const projectTests = testCases.filter(t => t.projectId === projectId || (t as any).projectId === projectId);
        const projectBugs = bugs.filter(b => b.projectId === projectId || (b as any).projectId === projectId);
        const openBugs = projectBugs.filter(b => b.status === 'Opened' || b.status === 'Fixed');

        return {
            tests: projectTests.length,
            bugs: projectBugs.length,
            openBugs: openBugs.length
        };
    };

    // Helper to check if bug is stale (3+ days without update)
    const isBugStale = (bug: typeof bugs[0]) => {
        // Only show warning for bugs with "Opened" status
        if (bug.status !== 'Opened') return false;
        
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return new Date(bug.createdAt) < threeDaysAgo;
    };

    // Helper to check if test case is stale (3+ days without update)
    const isTestCaseStale = (testCase: typeof testCases[0]) => {
        // Only show warning for test cases with "Todo" or "Draft" status
        if (testCase.status !== 'Todo' && testCase.status !== 'Draft') return false;
        
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return new Date(testCase.createdAt) < threeDaysAgo;
    };

    // Get recent bugs for DEV user (last 5, sorted by newest)
    const getRecentBugs = () => {
        if (user?.role !== 'DEV') return [];
        
        // Get bugs from active project only
        const projectBugs = bugs.filter(b => 
            String(b.projectId) === String(activeProjectId) &&
            b.status !== 'Closed'
        );
        
        // Sort by creation date (newest first) and take first 5
        return projectBugs
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    };

    // Get recent test cases for QA user (last 3, sorted by newest)
    const getRecentTestCases = () => {
        if (user?.role !== 'QA') return [];
        
        // Get test cases from active project only
        const projectTestCases = testCases.filter(t => 
            String(t.projectId) === String(activeProjectId)
        );
        
        // Sort by creation date (newest first) and take first 3
        return projectTestCases
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
    };

    // Get recently fixed bugs for QA user (last 3, sorted by newest)
    const getRecentlyFixedBugs = () => {
        if (user?.role !== 'QA') return [];
        
        // Get fixed bugs from active project only
        const fixedBugs = bugs.filter(b => 
            String(b.projectId) === String(activeProjectId) &&
            b.status === 'Fixed'
        );
        
        // Sort by creation date (newest first) and take first 3
        return fixedBugs
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
    };

    const recentBugs = getRecentBugs();
    const recentTestCases = getRecentTestCases();
    const recentlyFixedBugs = getRecentlyFixedBugs();

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-sm text-muted-foreground">Manage your QA workflow</p>
                </div>
                {user?.role === 'QA' && (
                    <Button size="icon" onClick={() => navigate('/create-project')}>
                        <Plus size={20} />
                    </Button>
                )}
            </div>

            {userProjects.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
                        <ListTodo size={32} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">No Projects Yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {user?.role === 'QA'
                                ? 'Create your first project to get started'
                                : 'You haven\'t been added to any projects yet'}
                        </p>
                    </div>
                    {user?.role === 'QA' && (
                        <Button onClick={() => navigate('/create-project')}>
                            <Plus size={16} className="mr-2" />
                            Create Project
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {userProjects.map((project) => {
                        const projectId = getProjectId(project);
                        const stats = getProjectStats(projectId);
                        const isActive = activeProjectId === projectId;

                        return (
                            <div
                                key={projectId}
                                className={`glass-card p-4 rounded-xl transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setActiveProjectId(projectId)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                                            {isActive && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/20 text-primary rounded-full">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {project.description}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Users size={14} />
                                                <span>{project.members.length} members</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-400">
                                                <ListTodo size={14} />
                                                <span>{stats.tests} tests</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-red-400">
                                                <Bug size={14} />
                                                <span>{stats.openBugs}/{stats.bugs} bugs</span>
                                            </div>
                                        </div>
                                    </motion.button>

                                    <div className="flex items-center gap-2">
                                        {user?.role === 'QA' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/projects/${projectId}/settings`);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                                                title="Manage Permissions"
                                            >
                                                <Settings size={18} />
                                            </button>
                                        )}
                                        {/* Team members chevron button - commented out for future use
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProjectForMembers(projectId);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                                            title="View Team Members"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                        */}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Recent Test Cases Section for QA users */}
            {user?.role === 'QA' && activeProjectId && recentTestCases.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Recent Test Cases</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/tests')} className="text-sm">
                            View All
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {recentTestCases.map((testCase) => {
                            const testCaseId = (testCase as any)._id || testCase.id;
                            const isStale = isTestCaseStale(testCase);
                            const statusColors: Record<string, string> = {
                                'Draft': 'bg-gray-500/10 text-gray-400',
                                'Todo': 'bg-blue-500/10 text-blue-400',
                                'In Progress': 'bg-yellow-500/10 text-yellow-500',
                                'Pass': 'bg-green-500/10 text-green-500',
                                'Fail': 'bg-red-500/10 text-red-500'
                            };

                            return (
                                <motion.div
                                    key={testCaseId}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => navigate(`/tests/${testCaseId}`)}
                                    className="glass-card p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors relative"
                                >
                                    {isStale && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs">
                                            <AlertTriangle size={12} />
                                            <span>Stale</span>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {testCase.friendlyId && (
                                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        {testCase.friendlyId}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[testCase.status] || 'bg-slate-500/10 text-slate-500'}`}>
                                                    {testCase.status}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-base truncate">{testCase.title}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            testCase.priority === 'High' ? 'bg-red-500/20 text-red-500' :
                                            testCase.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {testCase.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock size={12} />
                                        <span>{new Date(testCase.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recently Fixed Bugs Section for QA users */}
            {user?.role === 'QA' && activeProjectId && recentlyFixedBugs.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Recently Fixed Bugs</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/bugs')} className="text-sm">
                            View All
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {recentlyFixedBugs.map((bug) => {
                            const bugId = (bug as any)._id || bug.id;
                            const severityColors: Record<string, string> = {
                                'Low': 'bg-blue-500/10 text-blue-500',
                                'Medium': 'bg-yellow-500/20 text-yellow-500',
                                'High': 'bg-orange-500/20 text-orange-500',
                                'Critical': 'bg-red-500/20 text-red-500'
                            };

                            return (
                                <motion.div
                                    key={bugId}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => navigate(`/bugs/${bugId}`)}
                                    className="glass-card p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {bug.friendlyId && (
                                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        {bug.friendlyId}
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                                    Fixed
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-base truncate">{bug.title}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[bug.severity] || 'bg-slate-500/10 text-slate-500'}`}>
                                            {bug.severity}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock size={12} />
                                        <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Bugs Section for DEV users */}
            {/* Recent Bugs Section for DEV users */}
            {user?.role === 'DEV' && activeProjectId && recentBugs.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Recent Bugs</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/bugs')} className="text-sm">
                            View All
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {recentBugs.map((bug) => {
                            const bugId = (bug as any)._id || bug.id;
                            const isStale = isBugStale(bug);
                            const statusColors: Record<string, string> = {
                                'Draft': 'bg-gray-500/10 text-gray-400',
                                'Fixed': 'bg-green-500/10 text-green-500',
                                'Assigned': 'bg-yellow-500/10 text-yellow-500',
                                'Retest': 'bg-yellow-500/10 text-yellow-500',
                                'Opened': 'bg-red-500/10 text-red-500'
                            };

                            return (
                                <motion.div
                                    key={bugId}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => navigate(`/bugs/${bugId}`)}
                                    className="glass-card p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors relative"
                                >
                                    {isStale && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs">
                                            <AlertTriangle size={12} />
                                            <span>Stale</span>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {bug.friendlyId && (
                                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        {bug.friendlyId}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[bug.status] || 'bg-slate-500/10 text-slate-500'}`}>
                                                    {bug.status}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-base truncate">{bug.title}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            bug.severity === 'Critical' ? 'bg-red-500/20 text-red-500' :
                                            bug.severity === 'High' ? 'bg-orange-500/20 text-orange-500' :
                                            bug.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {bug.severity}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock size={12} />
                                        <span>{new Date(bug.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Team Members Modal - commented out for future use
            {selectedProject && (
                <TeamMembersModal
                    projectId={getProjectId(selectedProject)}
                    projectName={selectedProject.name}
                    members={selectedProject.members}
                    createdBy={selectedProject.createdBy}
                    isOpen={!!selectedProjectForMembers}
                    onClose={() => setSelectedProjectForMembers(null)}
                />
            )}
            */}
        </div>
    );
}
