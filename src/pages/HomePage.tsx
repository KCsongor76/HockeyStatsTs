import React, {useEffect, useState} from 'react';
import {ADMIN_ITEMS, NORMAL_ITEMS, START_ITEM} from "../OOP/constants/MenuItems";
import styles from "./HomePage.module.css";
import {useNavigate} from "react-router-dom";

interface HomePageProps {
    isSignedIn: boolean | undefined;
}

const HomePage: React.FC<HomePageProps> = ({isSignedIn}) => {
    const [menuItems, setMenuItems] = useState([START_ITEM]);
    const navigate = useNavigate();

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

            <ul className={styles.menuGrid}>
                {menuItems.map((item, index) => (
                    // <MenuItem key={index} item={item}/>
                    <li
                        className={styles.menuItem}
                        onClick={() => navigate(item.path)}
                        data-testid="menu-item"
                        key={index}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <div className={styles.content}>
                            <h2>{item.title}</h2>
                            <p>{item.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HomePage;