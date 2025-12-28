import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Bug, PlusCircle, FileText, User, X, CheckSquare, ChevronDown, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NotificationBell from "./NotificationBell";
import { usePermissions } from "../hooks/usePermissions";

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { createPreference } = useAuth();
    const { projects, activeProjectId } = useData();
    const { canViewTasks, canCreateTasks } = usePermissions();
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showProjectMenu, setShowProjectMenu] = useState(false);

    const activeProject = projects.find(p => {
        const pId = (p as any)._id || p.id;
        return pId === activeProjectId;
    });

    const handleCreateClick = () => {
        if (createPreference === 'test') {
            navigate('/tests/create');
        } else if (createPreference === 'bug') {
            navigate('/bugs/create');
        } else {
            setShowCreateMenu(!showCreateMenu);
        }
    };

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: FileText, label: "Tests", path: "/tests" },
        { icon: Bug, label: "Bugs", path: "/bugs" },
        // Only show Tasks if allowed
        ...(canViewTasks ? [{ icon: CheckSquare, label: "Tasks", path: "/tasks" }] : []),
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                    QA Share
                </button>

                {/* Create Button - Centered */}
                <button
                    onClick={handleCreateClick}
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:scale-105 transition-transform active:scale-95",
                        showCreateMenu && "bg-slate-700"
                    )}
                >
                    {showCreateMenu ? <X size={18} /> : <PlusCircle size={18} />}
                    <span>Create</span>
                </button>

                <div className="flex items-center gap-3">
                    {activeProject && (
                        <div className="relative">
                            <button
                                onClick={() => setShowProjectMenu(!showProjectMenu)}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-right"
                            >
                                <div>
                                    <div className="text-xs text-muted-foreground">Project</div>
                                    <div className="text-sm font-semibold truncate max-w-[100px]">{activeProject.name}</div>
                                </div>
                                <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", showProjectMenu && "rotate-180")} />
                            </button>
                        </div>
                    )}
                    <NotificationBell />
                </div>
            </header>

            {/* Project Switcher Dropdown */}
            <AnimatePresence>
                {showProjectMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowProjectMenu(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="fixed top-16 right-4 w-56 glass-card bg-slate-900/95 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
                        >
                            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                {projects.map((project) => {
                                    const projectId = (project as any)._id || project.id;
                                    const isActive = projectId === activeProjectId;
                                    return (
                                        <button
                                            key={projectId}
                                            onClick={() => {
                                                navigate('/');
                                                // Set active project via context
                                                const event = new CustomEvent('switchProject', { detail: projectId });
                                                window.dispatchEvent(event);
                                                setShowProjectMenu(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                                                isActive ? "bg-primary/20 text-primary" : "hover:bg-white/10 text-white"
                                            )}
                                        >
                                            <span className="truncate font-medium">{project.name}</span>
                                            {isActive && <Check size={16} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create Menu Popup */}
            <AnimatePresence>
                {showCreateMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateMenu(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: -20 }}
                            className="fixed top-20 left-1/2 -translate-x-1/2 flex flex-col gap-3 w-48 z-50"
                        >
                            <button
                                onClick={() => {
                                    navigate('/tests/create');
                                    setShowCreateMenu(false);
                                }}
                                className="glass-card bg-slate-900/95 p-4 rounded-xl hover:bg-white/10 transition-all flex items-center gap-3"
                            >
                                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                    <FileText size={20} />
                                </div>
                                <span className="font-medium">New Test Case</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/bugs/create');
                                    setShowCreateMenu(false);
                                }}
                                className="glass-card bg-slate-900/95 p-4 rounded-xl hover:bg-white/10 transition-all flex items-center gap-3"
                            >
                                <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                                    <Bug size={20} />
                                </div>
                                <span className="font-medium">New Bug</span>
                            </button>

                            {canCreateTasks && (
                                <button
                                    onClick={() => {
                                        navigate('/tasks/create');
                                        setShowCreateMenu(false);
                                    }}
                                    className="glass-card bg-slate-900/95 p-4 rounded-xl hover:bg-white/10 transition-all flex items-center gap-3"
                                >
                                    <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                                        <CheckSquare size={20} />
                                    </div>
                                    <span className="font-medium">New Task</span>
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="pt-20 px-4 max-w-md mx-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 pb-safe">


                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-16 h-14 gap-1 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={20} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        );


                    })}
                </div>
            </nav>
        </div>
    );
}
