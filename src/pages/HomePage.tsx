import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from "./HomePage.module.css";

interface HomePageProps {
    isSignedIn: boolean | undefined;
}

// todo: responsive styling: 4/2/1 or 2/2/1 columns

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
                    path: '/start'
                },
                {
                    title: 'Previous Games',
                    description: 'Review and analyze past game records',
                    icon: '📊',
                    path: '/previous_games'
                },
                {
                    title: 'Manage Teams',
                    description: 'Create, edit, and manage hockey teams',
                    icon: '🏆',
                    path: '/handleTeams'
                },
                {
                    title: 'Manage Players',
                    description: 'Add, transfer, and track player information',
                    icon: '👥',
                    path: '/handlePlayers'
                },
            ]);
        } else {
            setMenuItems([
                {
                    title: 'Start New Game',
                    description: 'Begin a new hockey game tracking session',
                    icon: '🏒',
                    path: '/start'
                },
                {
                    title: 'Previous Games',
                    description: 'Review and analyze past game records',
                    icon: '📊',
                    path: '/previous_games'
                },
                {
                    title: 'Admin Login',
                    description: 'Access admin features',
                    icon: '🔑',
                    path: '/admin'
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