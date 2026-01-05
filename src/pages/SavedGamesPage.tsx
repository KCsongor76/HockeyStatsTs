import React, {useEffect, useMemo, useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {GameService} from "../OOP/services/GameService";
import {useNavigate} from "react-router-dom";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {GameType} from "../OOP/enums/GameType";
import Pagination from "../components/Pagination";
import {SAVED_GAMES} from "../OOP/constants/NavigationNames";
import LoadingSpinner from "../components/LoadingSpinner";
import {Team} from "../OOP/classes/Team";
import {Game, GameFilterCriteria} from "../OOP/classes/Game";

interface SavedGamesPageProps {
    playerGames?: Game[];
    showFilters?: boolean;
}

const SavedGamesPage = ({playerGames, showFilters}: SavedGamesPageProps) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<Game[]>(playerGames || []);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [filters, setFilters] = useState<GameFilterCriteria>({
        homeTeamId: "",
        awayTeamId: "",
        championship: "",
        season: "",
        gameType: ""
    });

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [pagination, setPagination] = useState({page: 1, perPage: 10});

    const navigate = useNavigate();

    // Use Memoization for expensive filtering/sorting operations
    const processedGames = useMemo(() => {
        const filtered = Game.filter(games, filters);
        return Game.sort(filtered, sortOrder);
    }, [games, filters, sortOrder]);

    // Pagination Logic
    const {currentGames, totalPages} = useMemo(() => {
        const indexOfLastGame = pagination.page * pagination.perPage;
        const indexOfFirstGame = indexOfLastGame - pagination.perPage;
        return {
            currentGames: processedGames.slice(indexOfFirstGame, indexOfLastGame),
            totalPages: Math.ceil(processedGames.length / pagination.perPage)
        };
    }, [processedGames, pagination]);

    const handleFilterChange = (key: keyof GameFilterCriteria, value: any) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, page: 1})); // Reset to page 1 on filter change
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                setIsLoading(true);

                // Fetch teams regardless (needed for dropdowns)
                const teamsData = await TeamService.getAllTeams();
                setTeams(teamsData);

                if (!playerGames) {
                    const gamesData = await GameService.getAllGames();
                    setGames(gamesData);
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

    if (isLoading) return <LoadingSpinner/>;
    if (error) return <div>{error}</div>;

    return (
        <>
            {showFilters && (
                <>
                    <label>Home team:
                        <select value={filters.homeTeamId}
                                onChange={(e) => handleFilterChange('homeTeamId', e.target.value)}>
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </label>

                    <label>Away team:
                        <select value={filters.awayTeamId}
                                onChange={(e) => handleFilterChange('awayTeamId', e.target.value)}>
                            <option value="">All Teams</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </label>

                    <label>Championship:
                        <select value={filters.championship}
                                onChange={(e) => handleFilterChange('championship', e.target.value)}>
                            <option value="">All Championships</option>
                            {Object.values(Championship).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>

                    <label>Season:
                        <select value={filters.season} onChange={(e) => handleFilterChange('season', e.target.value)}>
                            <option value="">All Seasons</option>
                            {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </label>

                    <label>GameType:
                        <select value={filters.gameType}
                                onChange={(e) => handleFilterChange('gameType', e.target.value)}>
                            <option value="">All GameTypes</option>
                            {Object.values(GameType).map(gt => <option key={gt} value={gt}>{gt}</option>)}
                        </select>
                    </label>

                    <label>Sort order:
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}>
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </label>
                </>
            )}

            <ul>
                {currentGames.length > 0 ? (
                    currentGames.map((game) => (
                        <li key={game.id} onClick={() => navigate(`/${SAVED_GAMES}/${game.id}`, {state: game})}>
                            <img src={game.teams.home.logo} alt={game.teams.home.name}/>
                            <span>{game.teams.home.name}</span>

                            <span>{game.score.home.goals} - {game.score.away.goals}</span>

                            <span>{game.formattedDate}</span>

                            <span>Championship: {game.championship}</span>
                            <span>Type: {game.type}</span>
                            <span>Season: {game.season || "Not specified"}</span>

                            <img src={game.teams.away.logo} alt={game.teams.away.name}/>
                            <span>{game.teams.away.name}</span>
                        </li>
                    ))
                ) : <p>No games found.</p>}
            </ul>
            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
        </>
    );
};

export default SavedGamesPage;