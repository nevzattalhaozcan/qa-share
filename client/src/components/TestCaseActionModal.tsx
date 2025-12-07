import { useState, useRef, useEffect } from 'react';
import { X, Copy, ArrowRight, CopyPlus, Loader2, ChevronDown, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { useData } from '../context/DataContext';
import {
    duplicateTestCase as duplicateTestCaseApi,
    moveTestCase as moveTestCaseApi,
    bulkDuplicateTestCases,
    bulkMoveTestCases
} from '../lib/api';

type ActionType = 'duplicate' | 'move' | 'duplicate-move';

interface TestCaseActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedTestCaseIds: string[];
    onComplete: () => void;
}

export default function TestCaseActionModal({
    isOpen,
    onClose,
    selectedTestCaseIds,
    onComplete
}: TestCaseActionModalProps) {
    const { projects, activeProjectId, refetchData } = useData();
    const [action, setAction] = useState<ActionType>('duplicate');
    const [targetProjectId, setTargetProjectId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const otherProjects = projects.filter(p => {
        const pId = (p as any)._id || p.id;
        return pId !== activeProjectId;
    });

    const selectedProject = otherProjects.find(p => {
        const pId = (p as any)._id || p.id;
        return pId === targetProjectId;
    });

    const isSingle = selectedTestCaseIds.length === 1;
    const needsTargetProject = action === 'move' || action === 'duplicate-move';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowProjectDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setAction('duplicate');
            setTargetProjectId('');
            setError(null);
            setShowProjectDropdown(false);
        }
    }, [isOpen]);

    // Disable background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleSubmit = async () => {
        if (needsTargetProject && !targetProjectId) {
            setError('Please select a target project');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isSingle) {
                const id = selectedTestCaseIds[0];
                if (action === 'duplicate') {
                    await duplicateTestCaseApi(id);
                } else if (action === 'move') {
                    await moveTestCaseApi(id, targetProjectId);
                } else if (action === 'duplicate-move') {
                    await duplicateTestCaseApi(id, targetProjectId);
                }
            } else {
                if (action === 'duplicate') {
                    await bulkDuplicateTestCases(selectedTestCaseIds);
                } else if (action === 'move') {
                    await bulkMoveTestCases(selectedTestCaseIds, targetProjectId);
                } else if (action === 'duplicate-move') {
                    await bulkDuplicateTestCases(selectedTestCaseIds, targetProjectId);
                }
            }

            await refetchData();
            onComplete();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.msg || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const actionButtons = [
        {
            type: 'duplicate' as ActionType,
            icon: Copy,
            label: 'Duplicate',
            description: 'Create a copy in the same project'
        },
        {
            type: 'move' as ActionType,
            icon: ArrowRight,
            label: 'Move',
            description: 'Move to another project'
        },
        {
            type: 'duplicate-move' as ActionType,
            icon: CopyPlus,
            label: 'Duplicate & Move',
            description: 'Create a copy in another project'
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50"
                    >
                        <div className="glass-card rounded-2xl p-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold">Test Case Actions</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTestCaseIds.length} test case{selectedTestCaseIds.length > 1 ? 's' : ''} selected
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    disabled={isLoading}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Action Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Select Action
                                </label>
                                <div className="grid gap-2">
                                    {actionButtons.map(({ type, icon: Icon, label, description }) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setAction(type);
                                                setError(null);
                                                if (type === 'duplicate') {
                                                    setTargetProjectId('');
                                                }
                                            }}
                                            disabled={isLoading}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${action === type
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-white/10 hover:bg-white/5'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${action === type ? 'bg-primary/20' : 'bg-white/5'
                                                }`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{label}</div>
                                                <div className="text-xs text-muted-foreground">{description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Project Selector - Custom Dropdown */}
                            {needsTargetProject && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Target Project
                                    </label>
                                    {otherProjects.length === 0 ? (
                                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                                            No other projects available. Create another project first.
                                        </div>
                                    ) : (
                                        <div className="relative" ref={dropdownRef}>
                                            {/* Dropdown Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                                                disabled={isLoading}
                                                className={`flex items-center justify-between w-full h-12 px-4 rounded-xl border transition-all ${showProjectDropdown
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FolderOpen size={18} className="text-muted-foreground" />
                                                    <span className={selectedProject ? 'text-foreground' : 'text-muted-foreground'}>
                                                        {selectedProject ? selectedProject.name : 'Select a project...'}
                                                    </span>
                                                </div>
                                                <ChevronDown
                                                    size={18}
                                                    className={`text-muted-foreground transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`}
                                                />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <AnimatePresence>
                                                {showProjectDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl overflow-hidden z-10"
                                                    >
                                                        <div className="py-1 max-h-48 overflow-y-auto">
                                                            {otherProjects.map((project) => {
                                                                const pId = (project as any)._id || project.id;
                                                                const isSelected = pId === targetProjectId;
                                                                return (
                                                                    <button
                                                                        key={pId}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setTargetProjectId(pId);
                                                                            setShowProjectDropdown(false);
                                                                            setError(null);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center justify-between ${isSelected
                                                                                ? 'bg-primary/20 text-primary font-semibold'
                                                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <FolderOpen size={16} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                                                                            <span>{project.name}</span>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={isLoading || (needsTargetProject && otherProjects.length === 0)}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={16} className="mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {action === 'duplicate' && 'Duplicate'}
                                            {action === 'move' && 'Move'}
                                            {action === 'duplicate-move' && 'Duplicate & Move'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
