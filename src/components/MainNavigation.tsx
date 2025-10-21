import styles from './MainNavigation.module.css';
import {NavLink, useNavigate} from 'react-router-dom';
import {auth} from "../firebase";
import {signOut} from "firebase/auth";
import { useState } from 'react';

interface MainNavigationProps {
    isSignedIn: boolean | undefined;
}

const MainNavigation = ({isSignedIn}: MainNavigationProps) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            if (window.confirm('Are you sure you want to sign out?')) {
                await signOut(auth);
                localStorage.removeItem('token');
                navigate('/');
            }
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav className={styles.nav}>
            <button
                className={styles.mobileToggle}
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                ☰
            </button>

            <ul className={`${styles.navList} ${isMenuOpen ? styles.navListOpen : ''}`}>
                <li>
                    <NavLink
                        to="/"
                        className={({isActive}) => isActive ? styles.active : styles.link}
                        onClick={closeMenu}
                    >
                        Home
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/start"
                        className={({isActive}) => isActive ? styles.active : styles.link}
                        onClick={closeMenu}
                    >
                        Start Game
                    </NavLink>
                </li>

                {isSignedIn === undefined && <li className={styles.link}>Loading...</li>}

                {isSignedIn && (
                    <>
                        <li>
                            <NavLink
                                to="/previous_games"
                                className={({isActive}) => isActive ? styles.active : styles.link}
                                onClick={closeMenu}
                            >
                                Previous Games
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/handleTeams"
                                className={({isActive}) => isActive ? styles.active : styles.link}
                                onClick={closeMenu}
                            >
                                Teams
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/handlePlayers"
                                className={({isActive}) => isActive ? styles.active : styles.link}
                                onClick={closeMenu}
                            >
                                Players
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/"
                                onClick={(e) => {
                                    e.preventDefault();
                                    closeMenu();
                                    handleLogout();
                                }}
                                className={styles.link}
                            >
                                Logout
                            </NavLink>
                        </li>
                    </>
                )}

                {!isSignedIn && isSignedIn !== undefined && (
                    <li>
                        <NavLink
                            to="/admin"
                            className={({isActive}) => isActive ? styles.active : styles.link}
                            onClick={closeMenu}
                        >
                            Admin Login
                        </NavLink>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default MainNavigation;