import React, {useEffect, useState} from 'react';
import {ADMIN_ITEMS, NORMAL_ITEMS, START_ITEM} from "../OOP/constants/MenuItems";
import MenuItem from "../components/MenuItem";
import styles from "./HomePage.module.css";

interface HomePageProps {
    isSignedIn: boolean | undefined;
}

const HomePage: React.FC<HomePageProps> = ({isSignedIn}) => {
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

            <ul className={styles.menuGrid}>
                {menuItems.map((item, index) => (
                    <MenuItem key={index} item={item}/>
                ))}
            </ul>
        </div>
    );
};

export default HomePage;