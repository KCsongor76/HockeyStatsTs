import {NavLink, useNavigate} from 'react-router-dom';
import {auth} from "../firebase";
import {signOut} from "firebase/auth";

interface MainNavigationProps {
    isSignedIn: boolean | undefined;
}

const MainNavigation = ({isSignedIn}: MainNavigationProps) => {

    const navigate = useNavigate()

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
        <nav>
            <ul>
                <li><NavLink to="/">Home</NavLink></li>
                <li><NavLink to="/start">Start Game</NavLink></li>

                {isSignedIn === undefined && (
                    <li>Loading...</li>
                )}

                {isSignedIn && (
                    <>
                        <li><NavLink to="/previous_games">Previous Games</NavLink></li>
                        <li><NavLink to="/handleTeams">Teams</NavLink></li>
                        <li><NavLink to="/handlePlayers">Players</NavLink></li>
                        <li><NavLink to="/" onClick={handleLogout}>Logout</NavLink></li>
                    </>
                )}

                {/* Unauthenticated link */}
                {!isSignedIn && isSignedIn !== undefined && (
                    <li><NavLink to="/admin">Admin Login</NavLink></li>
                )}
            </ul>
        </nav>
    );
};

export default MainNavigation;
