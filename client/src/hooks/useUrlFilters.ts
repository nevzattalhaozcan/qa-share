import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

export function useUrlFilters<T extends Record<string, string[]>>(defaultFilters: T) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState<T>(defaultFilters);

    // Initialize filters from URL on mount
    useEffect(() => {
        const newFilters = { ...defaultFilters };
        let hasUpdates = false;

        Object.keys(defaultFilters).forEach(key => {
            const paramValue = searchParams.get(key);
            if (paramValue) {
                // Assume comma-separated values for arrays
                (newFilters as any)[key] = paramValue.split(',');
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            setFilters(newFilters);
        }
    }, []); // Run only on mount

    // Update URL when filters change
    const updateUrl = useCallback((newFilters: T) => {
        const newParams = new URLSearchParams(searchParams);

        Object.entries(newFilters).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                newParams.set(key, value.join(','));
            } else {
                newParams.delete(key);
            }
        });

        setSearchParams(newParams, { replace: true });
    }, [searchParams, setSearchParams]);

    const toggleFilter = useCallback((type: keyof T, value: string) => {
        setFilters(prev => {
            const currentValues = prev[type] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            const newFilters = { ...prev, [type]: newValues };
            updateUrl(newFilters);
            return newFilters;
        });
    }, [updateUrl]);

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
        updateUrl(defaultFilters);
    }, [defaultFilters, updateUrl]);

    return { filters, toggleFilter, clearFilters, setFilters };
}
