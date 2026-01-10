import React, {useEffect, useState} from 'react';
import {ADMIN_ITEMS, NORMAL_ITEMS, START_ITEM} from "../OOP/constants/MenuItems";
import {useNavigate} from "react-router-dom";
import MenuItem from "../components/MenuItem";
import styles from "./HomePage.module.css";

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
        <div className={styles.container}>
            <h1 className={styles.title}>Hockey Game Tracker</h1>
            <p className={styles.subtitle}>Your comprehensive hockey game management platform</p>

            <ul className={styles.grid}>
                {menuItems.map((item, index) => (
                    <MenuItem key={index} item={item} onClick={() => navigate(item.path)} />
                ))}
            </ul>
        </div>
    );
};

export default HomePage;