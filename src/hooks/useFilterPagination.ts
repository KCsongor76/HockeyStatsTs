import {useCallback, useState} from 'react';

export function useFilterPagination<T, F>(
    initialFilters: F,
    initialPerPage: number = 10
) {
    const [filters, setFilters] = useState<F>(initialFilters);
    const [pagination, setPagination] = useState({page: 1, perPage: initialPerPage});

    const handleFilterChange = (key: keyof F, value: any) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, page: 1}));
    };

    const paginate = useCallback((items: T[]) => {
        const indexOfLast = pagination.page * pagination.perPage;
        const indexOfFirst = indexOfLast - pagination.perPage;
        const totalPages = Math.ceil(items.length / pagination.perPage) || 1;
        const currentItems = items.slice(indexOfFirst, indexOfLast);
        return {currentItems, totalPages};
    }, [pagination]);

    return {
        filters,
        setFilters,
        pagination,
        setPagination,
        handleFilterChange,
        paginate
    };
}