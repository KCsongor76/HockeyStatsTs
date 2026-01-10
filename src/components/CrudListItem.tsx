import React from 'react';
import Button from "./Button";
import styles from './CrudListItem.module.css';

interface CrudListItemProps {
    label: string;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

const CrudListItem = ({label, onView, onEdit, onDelete}: CrudListItemProps) => {
    return (
        <li className={styles.container}>
            <span className={styles.label}>{label}</span>
            <div className={styles.buttonGroup}>
                <Button
                    styleType={"positive"}
                    onClick={onView}
                >
                    View
                </Button>

                <Button
                    styleType={"neutral"}
                    onClick={onEdit}
                >
                    Edit
                </Button>

                <Button
                    styleType={"negative"}
                    onClick={onDelete}
                >
                    Delete
                </Button>
            </div>
        </li>
    );
};

export default CrudListItem;