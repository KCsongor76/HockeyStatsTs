import React, {useEffect, useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {GameService} from "../OOP/services/GameService";
import {useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {IGame} from "../OOP/interfaces/IGame";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {GameType} from "../OOP/enums/GameType";
import Pagination from "../components/Pagination";
import styles from "./SavedGamesPage.module.css";
import {SAVED_GAMES} from "../OOP/constants/NavigationNames";
import LoadingSpinner from "../components/LoadingSpinner";

interface SavedGamesPageProps {
    playerGames?: IGame[];
    showFilters?: boolean;
}

const SavedGamesPage = ({playerGames, showFilters}: SavedGamesPageProps) => {
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [games, setGames] = useState<IGame[]>(playerGames || []);
    const [error, setError] = useState<string | null>(null);
    const [homeTeamId, setHomeTeamId] = useState<string>("");
    const [awayTeamId, setAwayTeamId] = useState<string>("");
    const [championship, setChampionship] = useState<Championship | "">("")
    const [season, setSeason] = useState<Season | "">("");
    const [gameType, setGameType] = useState<GameType | "">("");
    const [sortOrder, setSortOrder] = useState('newest');
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    const navigate = useNavigate();

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toISOString().split('T')[0];
    };

    const filteredGames = games.filter(game => {
        return (
            (!homeTeamId || game.teams.home.id === homeTeamId) &&
            (!awayTeamId || game.teams.away.id === awayTeamId) &&
            (!championship || game.championship === championship) &&
            (!gameType || game.type === gameType) &&
            (!season || game.season === season)
        );
    });

    const sortedGames = [...filteredGames].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const indexOfLastGame = pagination.page * pagination.perPage;
    const indexOfFirstGame = indexOfLastGame - pagination.perPage;
    const currentGames = sortedGames.slice(indexOfFirstGame, indexOfLastGame);
    const totalPages = Math.ceil(sortedGames.length / pagination.perPage);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                setIsLoading(true); // Start loading

                if (!playerGames) {
                    const [teamsData, gamesData] = await Promise.all([
                        TeamService.getAllTeams(),
                        GameService.getAllGames()
                    ]);
                    setTeams(teamsData);
                    setGames(gamesData);
                } else {
                    const teamsData = await TeamService.getAllTeams();
                    setTeams(teamsData);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Failed to load games data. Please try again later.");
            } finally {
                setIsLoading(false); // End loading
            }
        };

        fetchData();
    }, [playerGames]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className={styles.container}>
            {showFilters && (
                <div className={styles.filters}>
                    <div className={styles.inputContainer}>
                        <label htmlFor="homeTeam" className={styles.label}>Home team:</label>
                        <select
                            id="homeTeam"
                            value={homeTeamId}
                            onChange={(e) => setHomeTeamId(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">All Teams</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputContainer}>
                        <label htmlFor="awayTeam" className={styles.label}>Away team:</label>
                        <select
                            id="awayTeam"
                            value={awayTeamId}
                            onChange={(e) => setAwayTeamId(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">All Teams</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputContainer}>
                        <label htmlFor="championship" className={styles.label}>Championship:</label>
                        <select
                            id="championship"
                            value={championship}
                            onChange={(e) => setChampionship(e.target.value as Championship)}
                            className={styles.select}
                        >
                            <option value="">All Championships</option>
                            {Object.values(Championship).map(champ => (
                                <option key={champ} value={champ}>{champ}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputContainer}>
                        <label htmlFor="season" className={styles.label}>Season:</label>
                        <select
                            id="season"
                            value={season}
                            onChange={(e) => setSeason(e.target.value as Season)}
                            className={styles.select}
                        >
                            <option value="">All Seasons</option>
                            {Object.values(Season).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputContainer}>
                        <label htmlFor="gameType" className={styles.label}>GameType:</label>
                        <select
                            id="gameType"
                            value={gameType}
                            onChange={(e) => setGameType(e.target.value as GameType)}
                            className={styles.select}
                        >
                            <option value="">All GameTypes</option>
                            {Object.values(GameType).map(gt => (
                                <option key={gt} value={gt}>{gt}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.inputContainer}>
                        <label htmlFor="sortOrder" className={styles.label}>Sort order:</label>
                        <select
                            id="sortOrder"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={styles.select}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>
            )}

            <ul className={styles.gameList}>
                {currentGames.length > 0 ? (
                    currentGames.map((game: IGame) => (
                        <li
                            key={game.id}
                            className={styles.gameItem}
                            onClick={() => navigate(`/${SAVED_GAMES}/${game.id}`, {state: game})}
                        >
                            <div className={styles.gameTeams}>
                                <div className={styles.gameTeam}>
                                    <img
                                        src={game.teams.home.logo}
                                        alt={game.teams.home.name}
                                        className={styles.gameLogo}
                                    />
                                    <span>{game.teams.home.name}</span>
                                </div>

                                <div className={styles.gameInfo}>
                                    <span className={styles.gameScore}>
                                        {game.score.home.goals} - {game.score.away.goals}
                                    </span>
                                    <span>{formatDate(game.timestamp)}</span>
                                    <span>Type: {game.type}</span>
                                    <span>Season: {game.season || "Not specified"}</span>
                                </div>

                                <div className={styles.gameTeam}>
                                    <img
                                        src={game.teams.away.logo}
                                        alt={game.teams.away.name}
                                        className={styles.gameLogo}
                                    />
                                    <span>{game.teams.away.name}</span>
                                </div>
                            </div>
                        </li>
                    ))
                ) : <p>No games found.</p>}
            </ul>

            <div className={styles.pagination}>
                <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
            </div>
        </div>
    );
};

export default SavedGamesPage;