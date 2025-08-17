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

interface SavedGamesPageProps {
    playerGames?: IGame[];
    showFilters?: boolean;
}

const SavedGamesPage = ({playerGames, showFilters}: SavedGamesPageProps) => {
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [games, setGames] = useState<IGame[]>(playerGames || []);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [homeTeamId, setHomeTeamId] = useState<string>("");
    const [awayTeamId, setAwayTeamId] = useState<string>("");
    const [championship, setChampionship] = useState<Championship | "">("")
    const [season, setSeason] = useState<Season | "">("");
    const [gameType, setGameType] = useState<GameType | "">("");
    const [sortOrder, setSortOrder] = useState('newest');
    const [pagination, setPagination] = useState({page: 1, perPage: 10});

    const navigate = useNavigate();

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
                setIsLoading(true);
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
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [playerGames]);

    if (isLoading) {
        return <div>Loading games...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (games.length === 0 || filteredGames.length === 0) return <div>No games available.</div>;

    return (
        <div>
            {showFilters && (
                <>
                    <Select
                        label="Home team:"
                        value={homeTeamId}
                        onChange={(e) => setHomeTeamId(e.target.value)}
                        options={teams.map(team => ({
                            value: team.id,
                            label: team.name
                        }))}
                    />

                    <Select
                        label="Away team:"
                        value={awayTeamId}
                        onChange={(e) => setAwayTeamId(e.target.value)}
                        options={teams.map(team => ({
                            value: team.id,
                            label: team.name
                        }))}
                    />

                    <Select
                        label="Championship:"
                        value={championship}
                        onChange={(e) => setChampionship(e.target.value as Championship)}
                        options={[
                            { value: "", label: "All Championships" },
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
                            { value: "", label: "All Seasons" },
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
                            { value: "", label: "All GameTypes" },
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
                            { value: "newest", label: "Newest First" },
                            { value: "oldest", label: "Oldest First" }
                        ]}
                    />
                </>
            )}

            <ul>
                {currentGames.length > 0 ? (
                    currentGames.map((game: IGame) => (
                        <li key={game.id} onClick={() => navigate(`/previous_games/${game.id}`, {state: game})}>
                            <img
                                src={game.teams.home.logo}
                                alt={game.teams.home.logo}
                            />
                            <span>{game.teams.home.name}</span>

                            <span>{game.score.home.goals} - {game.score.away.goals}</span>

                            <img
                                src={game.teams.away.logo}
                                alt={game.teams.away.logo}
                            />
                            <span>{game.teams.away.name}</span>

                            <span>{game.timestamp}</span>

                            <span>Type: {game.type}</span>
                            <span>Season: {game.season || "Not specified"}</span>
                        </li>
                    ))
                ) : <p>No games found.</p>}
            </ul>

            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
        </div>
    );
};

export default SavedGamesPage;