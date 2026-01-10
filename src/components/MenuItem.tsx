import React from 'react';
import styles from './MenuItem.module.css';

export interface MenuItemProps {
    item: {
        path: string;
        icon: React.ReactNode;
        title: string;
        description: string;
    };
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({item, onClick}) => (
    <li className={styles.card} onClick={onClick}>
        <span className={styles.iconWrapper}>{item.icon}</span>
        <h2 className={styles.title}>{item.title}</h2>
        <p className={styles.description}>{item.description}</p>
    </li>
);

export default MenuItem;