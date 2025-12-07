import { useEffect, useCallback, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseUnsavedChangesOptions {
    hasUnsavedChanges: boolean;
    onNavigateAway: (path: string) => void;
}

export function useUnsavedChanges({ hasUnsavedChanges, onNavigateAway }: UseUnsavedChangesOptions) {
    const enableBlockerRef = useRef(true);

    // Block navigation within the app
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            enableBlockerRef.current && hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
    );

    // Handle browser back/forward and page refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // When blocker is triggered, call the navigation handler
    useEffect(() => {
        if (blocker.state === 'blocked') {
            enableBlockerRef.current = false;
            onNavigateAway(blocker.location.pathname);
        }
    }, [blocker.state, blocker.location, onNavigateAway, blocker]);

    const proceedNavigation = useCallback(() => {
        if (blocker.state === 'blocked') {
            enableBlockerRef.current = false;
            blocker.proceed();
        }
    }, [blocker]);

    const resetNavigation = useCallback(() => {
        if (blocker.state === 'blocked') {
            blocker.reset();
        }
        enableBlockerRef.current = true;
    }, [blocker]);

    const disableBlocker = useCallback(() => {
        enableBlockerRef.current = false;
    }, []);

    return {
        isBlocked: blocker.state === 'blocked',
        blockedPath: blocker.state === 'blocked' ? blocker.location.pathname : null,
        blocker,
        proceedNavigation,
        resetNavigation,
        disableBlocker,
    };
}
