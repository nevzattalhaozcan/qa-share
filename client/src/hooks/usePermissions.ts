import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const usePermissions = () => {
    const { user } = useAuth();
    const { projects, activeProjectId } = useData();

    const activeProject = projects.find(p => {
        const pId = (p as any)._id || p.id;
        return pId === activeProjectId;
    });
    const isQA = user?.role === 'QA';
    const isDev = user?.role === 'DEV';
    const permissions = activeProject?.permissions;

    // QAs have all permissions
    if (isQA) {
        return {
            canViewTestCases: true,
            canCreateTestCases: true,
            canEditTestCases: true,
            canViewBugs: true,
            canCreateBugs: true,
            canEditBugs: true,
            canEditBugStatus: true,
            canViewNotes: true,
            canViewTasks: true,
            canCreateTasks: true,
            canEditTasks: true,
            canManagePermissions: true,
        };
    }

    // Devs follow project permissions
    if (isDev && permissions) {
        return {
            canViewTestCases: permissions.devCanViewTestCases,
            canCreateTestCases: permissions.devCanCreateTestCases,
            canEditTestCases: permissions.devCanEditTestCases,
            canViewBugs: permissions.devCanViewBugs,
            canCreateBugs: permissions.devCanCreateBugs,
            canEditBugs: permissions.devCanEditBugs,
            canEditBugStatus: permissions.devCanEditBugStatusOnly || permissions.devCanEditBugs,
            canViewNotes: permissions.devCanViewNotes,
            canViewTasks: permissions.devCanViewTasks,
            canCreateTasks: permissions.devCanCreateTasks,
            canEditTasks: permissions.devCanEditTasks,
            canManagePermissions: false,
        };
    }

    // Default: no permissions
    return {
        canViewTestCases: false,
        canCreateTestCases: false,
        canEditTestCases: false,
        canViewBugs: false,
        canCreateBugs: false,
        canEditBugs: false,
        canEditBugStatus: false,
        canViewNotes: false,
        canViewTasks: false,
        canCreateTasks: false,
        canEditTasks: false,
        canManagePermissions: false,
    };
};
