import styles from './MainNavigation.module.css';
import {NavLink, useNavigate} from 'react-router-dom';
import {auth} from "../firebase";
import {signOut} from "firebase/auth";
import {useState} from 'react';

interface MainNavigationProps {
    isSignedIn: boolean | undefined;
}

const MainNavigation = ({isSignedIn}: MainNavigationProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

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

    return (
        <nav className={styles.nav}>
            <span className={styles.mobileToggle} onClick={toggleMenu}>
                {isMenuOpen ? '▲ Close Menu ▲' : '▼ Open Menu ▼'}
            </span>
            <ul className={`${styles.navList} ${isMenuOpen ? styles.open : ''}`}>
                <li>
                    <NavLink to="/" className={({isActive}) => isActive ? styles.active : styles.link}>
                        Home
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/start" className={({isActive}) => isActive ? styles.active : styles.link}>
                        Start Game
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/upload" className={({isActive}) => isActive ? styles.active : styles.link}>
                        Upload Game
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/previous_games" className={({isActive}) => isActive ? styles.active : styles.link}>
                        Previous Games
                    </NavLink>
                </li>


                {isSignedIn === undefined && <li className={styles.link}>Loading...</li>}

                {isSignedIn && (
                    <>
                        <li>
                            <NavLink to="/handleTeams"
                                     className={({isActive}) => isActive ? styles.active : styles.link}
                            >
                                Teams
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/handlePlayers"
                                     className={({isActive}) => isActive ? styles.active : styles.link}
                            >
                                Players
                            </NavLink>
                        </li>
                        <li><NavLink to="/" onClick={handleLogout} className={styles.link}>Logout</NavLink></li>
                    </>
                )}

                {!isSignedIn && isSignedIn !== undefined && (
                    <li><NavLink to="/admin" className={({isActive}) => isActive ? styles.active : styles.link}>Admin
                        Login</NavLink></li>
                )}
            </ul>
        </nav>
    );
};

export default MainNavigation;