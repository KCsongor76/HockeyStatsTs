import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "./HomePage.module.css";
import {ADMIN, HANDLE_PLAYERS, HANDLE_TEAMS, SAVED_GAMES, START} from "../OOP/constants/NavigationNames";

interface HomePageProps {
    isSignedIn: boolean | undefined;
}

const HomePage: React.FC<HomePageProps> = ({isSignedIn}) => {
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([{
        title: 'Start New Game',
        description: 'Begin a new hockey game tracking session',
        icon: '🏒',
        path: '/start',
    }]);

    useEffect(() => {
        if (isSignedIn) {
            setMenuItems([
                {
                    title: 'Start New Game',
                    description: 'Begin a new hockey game tracking session',
                    icon: '🏒',
                    path: `/${START}`
                },
                {
                    title: 'Previous Games',
                    description: 'Review and analyze past game records',
                    icon: '📊',
                    path: `/${SAVED_GAMES}`
                },
                {
                    title: 'Manage Teams',
                    description: 'Create, edit, and manage hockey teams',
                    icon: '🏆',
                    path: `/${HANDLE_TEAMS}`
                },
                {
                    title: 'Manage Players',
                    description: 'Add, transfer, and track player information',
                    icon: '👥',
                    path: `/${HANDLE_PLAYERS}`
                },
            ]);
        } else {
            setMenuItems([
                {
                    title: 'Start New Game',
                    description: 'Begin a new hockey game tracking session',
                    icon: '🏒',
                    path: `/${START}`
                },
                {
                    title: 'Previous Games',
                    description: 'Review and analyze past game records',
                    icon: '📊',
                    path: `/${SAVED_GAMES}`
                },
                {
                    title: 'Admin Login',
                    description: 'Access admin features',
                    icon: '🔑',
                    path: `/${ADMIN}`
                }
            ]);
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