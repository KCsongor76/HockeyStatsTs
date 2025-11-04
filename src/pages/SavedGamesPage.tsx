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
import Select from "../components/Select";
import styles from "./SavedGamesPage.module.css";

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
            }
        };

        fetchData();
    }, [playerGames]);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className={styles.container}>
            {showFilters && (
                <div className={styles.filters}>
                    <Select
                        label="Home team:"
                        value={homeTeamId}
                        onChange={(e) => setHomeTeamId(e.target.value)}
                        options={[
                            {value: "", label: "All Teams"},
                            ...teams.map(team => ({
                                value: team.id,
                                label: team.name
                            }))]}
                    />

                    <Select
                        label="Away team:"
                        value={awayTeamId}
                        onChange={(e) => setAwayTeamId(e.target.value)}
                        options={[
                            {value: "", label: "All Teams"},
                            ...teams.map(team => ({
                                value: team.id,
                                label: team.name
                            }))]}
                    />

                    <Select
                        label="Championship:"
                        value={championship}
                        onChange={(e) => setChampionship(e.target.value as Championship)}
                        options={[
                            {value: "", label: "All Championships"},
                            ...Object.values(Championship).map(championship => ({
                                value: championship,
                                label: championship
                            }))
                        ]}
                    />

                    <Select
                        label="Season:"
                        value={season}
                        onChange={(e) => setSeason(e.target.value as Season)}
                        options={[
                            {value: "", label: "All Seasons"},
                            ...Object.values(Season).map(season => ({
                                value: season,
                                label: season
                            }))
                        ]}
                    />

                    <Select
                        label="GameType:"
                        value={gameType}
                        onChange={(e) => setGameType(e.target.value as GameType)}
                        options={[
                            {value: "", label: "All GameTypes"},
                            ...Object.values(GameType).map(gameType => ({
                                value: gameType,
                                label: gameType
                            }))
                        ]}
                    />

                    <Select
                        label="Sort order:"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        options={[
                            {value: "newest", label: "Newest First"},
                            {value: "oldest", label: "Oldest First"}
                        ]}
                    />
                </div>
            )}

            <ul className={styles.gameList}>
                {currentGames.length > 0 ? (
                    currentGames.map((game: IGame) => (
                        <li
                            key={game.id}
                            className={styles.gameItem}
                            onClick={() => navigate(`/previous_games/${game.id}`, {state: game})}
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