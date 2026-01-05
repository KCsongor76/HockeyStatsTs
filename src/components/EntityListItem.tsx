import React from 'react';
import Button from "./Button";

interface EntityListItemProps {
    children: React.ReactNode;
    onView: () => void;
    onDelete: () => void;
}

const EntityListItem: React.FC<EntityListItemProps> = ({children, onView, onDelete}) => {
    return (
        <li>
            <p>{children}</p>
            <div>
                <Button styleType="neutral" onClick={onView}>
                    View
                </Button>
                <Button styleType="negative" onClick={onDelete}>
                    Delete
                </Button>
            </div>
        </li>
    );
};

export default EntityListItem;