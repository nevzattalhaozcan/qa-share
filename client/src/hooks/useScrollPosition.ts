import { useEffect } from 'react';

export function useScrollPosition(key: string, isLoading: boolean) {
    useEffect(() => {
        const handleScroll = () => {
            // Save scroll position to session storage
            sessionStorage.setItem(key, window.scrollY.toString());
        };

        // Throttle scroll event (optional, but good for performance)
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const throttledScroll = () => {
            if (timeoutId === null) {
                timeoutId = setTimeout(() => {
                    handleScroll();
                    timeoutId = null;
                }, 100);
            }
        };

        window.addEventListener('scroll', throttledScroll);
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [key]);

    // Restore scroll position when loading finishes
    useEffect(() => {
        if (!isLoading) {
            const savedPosition = sessionStorage.getItem(key);
            if (savedPosition) {
                // Small timeout to ensure DOM is fully rendered
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedPosition, 10));
                }, 100);
            }
        }
    }, [key, isLoading]);
}
