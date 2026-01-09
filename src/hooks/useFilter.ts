import {useState, useCallback} from 'react';

export function useFilter<T>(initialState: T) {
    const [filters, setFilters] = useState<T>(initialState);

    const handleFilterChange = useCallback((key: keyof T, value: any) => {
        setFilters(prev => ({...prev, [key]: value}));
    }, []);

    return {filters, handleFilterChange, setFilters};
}