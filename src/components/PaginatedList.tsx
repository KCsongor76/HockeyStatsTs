import React, {useEffect, useMemo, useState} from 'react';
import Pagination from "./Pagination";

interface PaginatedListProps<T> {
    data: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemsPerPage?: number;
    renderEmpty?: () => React.ReactNode;
    listClassName?: string;
}

const PaginatedList = <T,>({
                               data,
                               renderItem,
                               itemsPerPage = 10,
                               renderEmpty,
                               listClassName
                           }: PaginatedListProps<T>) => {
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: itemsPerPage
    });

    // Reset to page 1 when data changes (e.g. filters applied)
    useEffect(() => {
        setPagination(prev => ({...prev, page: 1}));
    }, [data]);

    const totalPages = Math.ceil(data.length / pagination.perPage) || 1;

    const paginatedData = useMemo(() => {
        const start = (pagination.page - 1) * pagination.perPage;
        const end = start + pagination.perPage;
        return data.slice(start, end);
    }, [data, pagination]);

    if (data.length === 0) {
        return <>{renderEmpty ? renderEmpty() : <p>No items found.</p>}</>;
    }

    return (
        <>
            <ul className={listClassName}>
                {paginatedData.map((item, index) => renderItem(item, index))}
            </ul>
            <Pagination
                pagination={pagination}
                totalPages={totalPages}
                setPagination={setPagination}
            />
        </>
    );
};

export default PaginatedList;