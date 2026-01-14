import styles from './MainNavigation.module.css';
import {NavLink, useNavigate} from 'react-router-dom';
import {supabase} from "../supabase";
import {useState} from 'react';
import {ADMIN, HANDLE_PLAYERS, HANDLE_TEAMS, SAVED_GAMES, START} from "../OOP/constants/NavigationNames";

interface MainNavigationProps {
    isSignedIn: boolean | undefined;
}

const MainNavigation = ({isSignedIn}: MainNavigationProps) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            if (window.confirm('Are you sure you want to sign out?')) {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;

                // Clear any local tokens if you are manually managing them,
                // though Supabase handles session in local storage automatically.
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
            <NavLink to="/" className={styles.brand} onClick={closeMenu}>
                HockeyStats
            </NavLink>

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
                        to={`/${START}`}
                        className={({isActive}) => isActive ? styles.active : styles.link}
                        onClick={closeMenu}
                    >
                        Start Game
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to={`/${SAVED_GAMES}`}
                        className={({isActive}) => isActive ? styles.active : styles.link}
                        onClick={closeMenu}
                    >
                        Previous Games
                    </NavLink>
                </li>

                {isSignedIn === undefined && <li className={styles.link}>Loading...</li>}

                {isSignedIn && (
                    <>
                        <li>
                            <NavLink
                                to={`/${HANDLE_TEAMS}`}
                                className={({isActive}) => isActive ? styles.active : styles.link}
                                onClick={closeMenu}
                            >
                                Teams
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to={`/${HANDLE_PLAYERS}`}
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
                            to={`/${ADMIN}`}
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