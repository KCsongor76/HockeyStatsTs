import React, {useEffect} from 'react';
import Button from "./Button";
import styles from "./Pagination.module.css"

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
        <div className={styles.paginationContainer}>
            <div className={styles.buttonGroup}>
                <Button
                    styleType={"neutral"}
                    type="button"
                    disabled={pagination.page === 1}
                    onClick={goToPreviousPage}
                >
                    Previous
                </Button>

                <span className={styles.pageInfo}>
                Page {pagination.page} of {totalPages}
            </span>

                <Button
                    styleType={"neutral"}
                    type="button"
                    disabled={pagination.page >= totalPages}
                    onClick={goToNextPage}
                >
                    Next
                </Button>
            </div>

            <div className={styles.perPageContainer}>
                <span className={styles.perPageLabel}>Show:</span>
                <select
                    className={styles.perPageSelect}
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
        </div>
    );
};

export default Pagination;