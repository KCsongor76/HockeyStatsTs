import React from 'react';
import {useNavigate} from "react-router-dom";
import styles from "./MenuItem.module.css";

interface MenuItemProps {
    item: {
        title: string
        description: string
        icon: string
        path: string
    };
}

const MenuItem = ({item}: MenuItemProps) => {
    const navigate = useNavigate();

    return (
        <li
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
            data-testid="menu-item" // Added for easier testing
        >
            <span className={styles.icon}>{item.icon}</span>
            <div className={styles.content}>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
            </div>
        </li>
    );
};

export default MenuItem;