import React, {useEffect} from 'react';

interface PaginationProps {
    pagination: { page: number, perPage: number };
    totalPages: number;
    setPagination: (value: React.SetStateAction<{
        page: number
        perPage: number
    }>) => void
}

const Pagination: React.FC<PaginationProps> = ({pagination, totalPages, setPagination}) => {
    const perPageOptions = [10, 25, 50, 100];

    const goToPreviousPage = () => {
        if (pagination.page > 1) {
            setPagination(p => ({...p, page: p.page - 1}));
        }
    };

    const goToNextPage = () => {
        if (pagination.page < totalPages) {
            setPagination(p => ({...p, page: p.page + 1}));
        }
    };

    useEffect(() => {
        // scroll automatically to the bottom on page change or team per page change
        window.scrollTo(0, document.body.scrollHeight);
    }, [pagination.page, pagination.perPage]);

    return (
        <div>
            <div>
                <button
                    type="button"
                    disabled={pagination.page === 1}
                    onClick={goToPreviousPage}
                >
                    Previous
                </button>

                <button
                    type="button"
                    disabled={pagination.page >= totalPages}
                    onClick={goToNextPage}
                >
                    Next
                </button>
            </div>

            <select
                value={pagination.perPage}
                onChange={e => setPagination({
                    page: 1,
                    perPage: parseInt(e.target.value)
                })}
            >
                {perPageOptions.map(option => (
                    <option key={option} value={option}>
                        {option} per page
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Pagination;