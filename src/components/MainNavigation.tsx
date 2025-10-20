import styles from './MainNavigation.module.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

interface MainNavigationProps {
    isSignedIn: boolean | undefined;
}

// todo: navigation is not shown-available-clickable under 768px

const MainNavigation = ({ isSignedIn }: MainNavigationProps) => {
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

    return (
        <nav className={styles.nav}>
            <ul className={styles.navList}>
                <li><NavLink to="/" className={({ isActive }) => isActive ? styles.active : styles.link}>Home</NavLink></li>
                <li><NavLink to="/start" className={({ isActive }) => isActive ? styles.active : styles.link}>Start Game</NavLink></li>

                {isSignedIn === undefined && <li className={styles.link}>Loading...</li>}

                {isSignedIn && (
                    <>
                        <li><NavLink to="/previous_games" className={({ isActive }) => isActive ? styles.active : styles.link}>Previous Games</NavLink></li>
                        <li><NavLink to="/handleTeams" className={({ isActive }) => isActive ? styles.active : styles.link}>Teams</NavLink></li>
                        <li><NavLink to="/handlePlayers" className={({ isActive }) => isActive ? styles.active : styles.link}>Players</NavLink></li>
                        <li><NavLink to="/" onClick={handleLogout} className={styles.link}>Logout</NavLink></li>
                    </>
                )}

                {!isSignedIn && isSignedIn !== undefined && (
                    <li><NavLink to="/admin" className={({ isActive }) => isActive ? styles.active : styles.link}>Admin Login</NavLink></li>
                )}
            </ul>
        </nav>
    );
};

export default MainNavigation;