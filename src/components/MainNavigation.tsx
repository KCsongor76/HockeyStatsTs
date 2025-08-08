import {NavLink} from 'react-router-dom';

interface MainNavigationProps {
    isSignedIn: boolean | undefined;
}

const MainNavigation = ({isSignedIn}: MainNavigationProps) => {
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
                        <li><NavLink to="/" onClick={() => {}}>Logout</NavLink></li>
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
