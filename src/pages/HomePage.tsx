import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "./HomePage.module.css";
import {ADMIN_ITEMS, NORMAL_ITEMS, START_ITEM} from "../OOP/constants/MenuItems";

interface HomePageProps {
    isSignedIn: boolean | undefined;
}

const HomePage: React.FC<HomePageProps> = ({isSignedIn}) => {
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([START_ITEM]);

    useEffect(() => {
        if (isSignedIn) {
            setMenuItems(ADMIN_ITEMS);
        } else {
            setMenuItems(NORMAL_ITEMS);
        }
    }, [isSignedIn]);

    return (
        <div className={styles.homeContainer}>
            <header className={styles.header}>
                <h1>Hockey Game Tracker</h1>
                <p>Your comprehensive hockey game management platform</p>
            </header>

            <div className={styles.menuGrid}>
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className={styles.menuItem}
                        onClick={() => navigate(item.path)}
                    >
                        <div className={styles.icon}>{item.icon}</div>
                        <div className={styles.content}>
                            <h2>{item.title}</h2>
                            <p>{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomePage;