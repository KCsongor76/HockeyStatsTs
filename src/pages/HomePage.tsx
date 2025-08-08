import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

interface HomePageProps {
    isSignedIn: boolean | undefined;
}

const HomePage: React.FC<HomePageProps> = ({isSignedIn}) => {
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([{
        title: 'Start New Game',
        description: 'Begin a new hockey game tracking session',
        icon: '🏒', // Hockey stick emoji
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
                {
                    title: 'Log Out',
                    description: 'Sign out of your admin account',
                    icon: '🔒',
                    path: "/"
                }
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
        <div>
            <header>
                <h1>Hockey Game Tracker</h1>
                <p>Your comprehensive hockey game management platform</p>
            </header>

            <div>
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(item.path)}
                    >
                        <div>{item.icon}</div>
                        <div>
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