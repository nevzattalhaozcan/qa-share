import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Bug, PlusCircle, FileText, User, X, CheckSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NotificationBell from "./NotificationBell";

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { createPreference } = useAuth();
    const { projects, activeProjectId } = useData();
    const [showCreateMenu, setShowCreateMenu] = useState(false);

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
        { icon: PlusCircle, label: "Create", path: "/tests/create", primary: true },
        { icon: Bug, label: "Bugs", path: "/bugs" },
        { icon: CheckSquare, label: "Tasks", path: "/tasks" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    QA Share
                </h1>
                <div className="flex items-center gap-3">
                    {activeProject && (
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Project</div>
                            <div className="text-sm font-semibold truncate max-w-[120px]">{activeProject.name}</div>
                        </div>
                    )}
                    <NotificationBell />
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20 px-4 max-w-md mx-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 pb-safe">
                <AnimatePresence>
                    {showCreateMenu && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCreateMenu(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-3 w-48"
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
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        if (item.primary) {
                            return (
                                <button
                                    key={item.path}
                                    onClick={handleCreateClick}
                                    className={cn(
                                        "relative -top-6 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/40 hover:scale-105 transition-transform active:scale-95 z-50",
                                        showCreateMenu && "rotate-45 bg-slate-700"
                                    )}
                                >
                                    {showCreateMenu ? <X size={24} /> : <Icon size={24} />}
                                </button>
                            );
                        }

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
