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
import Select from "../components/Select";
import {Team} from "../OOP/classes/Team";
import {Game, GameFilterCriteria} from "../OOP/classes/Game";
import {useFilterPagination} from "../hooks/useFilterPagination";

interface SavedGamesPageProps {
    playerGames?: Game[];
    showFilters?: boolean;
}

const SavedGamesPage = ({playerGames, showFilters}: SavedGamesPageProps) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [games, setGames] = useState<Game[]>(playerGames || []);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const {
        filters,
        handleFilterChange,
        pagination,
        setPagination,
        paginate
    } = useFilterPagination<Game, GameFilterCriteria>({
        homeTeamId: "",
        awayTeamId: "",
        championship: "",
        season: "",
        gameType: ""
    });

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const navigate = useNavigate();

    // Use Memoization for expensive filtering/sorting operations
    const processedGames = useMemo(() => {
        const filtered = Game.filter(games, filters);
        return Game.sort(filtered, sortOrder);
    }, [games, filters, sortOrder]);

    // Pagination Logic
    const {
        currentItems: currentGames,
        totalPages
    } = useMemo(() => paginate(processedGames), [processedGames, paginate]);

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

    // Option mappers
    const teamOptions = [
        {value: "", label: "All Teams"},
        ...teams.map(t => ({value: t.id, label: t.name}))
    ];
    const championshipOptions = [
        {value: "", label: "All Championships"},
        ...Object.values(Championship).map(c => ({value: c, label: c}))
    ];
    const seasonOptions = [
        {value: "", label: "All Seasons"},
        ...Object.values(Season).map(s => ({value: s, label: s}))
    ];
    const gameTypeOptions = [
        {value: "", label: "All GameTypes"},
        ...Object.values(GameType).map(gt => ({value: gt, label: gt}))
    ];
    const sortOptions = [
        {value: "newest", label: "Newest First"},
        {value: "oldest", label: "Oldest First"}
    ];

    if (isLoading) return <LoadingSpinner/>;
    if (error) return <div>{error}</div>;

    return (
        <>
            {showFilters && (
                <div>
                    <Select
                        id="homeTeamFilter"
                        label="Home team:"
                        value={filters.homeTeamId}
                        onChange={(e) => handleFilterChange('homeTeamId', e.target.value)}
                        options={teamOptions}
                    />

                    <Select
                        id="awayTeamFilter"
                        label="Away team:"
                        value={filters.awayTeamId}
                        onChange={(e) => handleFilterChange('awayTeamId', e.target.value)}
                        options={teamOptions}
                    />

                    <Select
                        id="championshipFilter"
                        label="Championship:"
                        value={filters.championship}
                        onChange={(e) => handleFilterChange('championship', e.target.value)}
                        options={championshipOptions}
                    />

                    <Select
                        id="seasonFilter"
                        label="Season:"
                        value={filters.season}
                        onChange={(e) => handleFilterChange('season', e.target.value)}
                        options={seasonOptions}
                    />

                    <Select
                        id="gameTypeFilter"
                        label="GameType:"
                        value={filters.gameType}
                        onChange={(e) => handleFilterChange('gameType', e.target.value)}
                        options={gameTypeOptions}
                    />

                    <Select
                        id="sortOrder"
                        label="Sort order:"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        options={sortOptions}
                    />
                </div>
            )}

            <ul>
                {currentGames.length > 0 ? (
                    currentGames.map((game) => (
                        <li
                            key={game.id}
                            onClick={() => navigate(`/${SAVED_GAMES}/${game.id}`, {state: game})}
                        >
                            <div>
                                <img src={game.teams.home.logo} alt={game.teams.home.name}/>
                                <span>{game.teams.home.name}</span>
                            </div>

                            <span>
                                {game.score.home.goals} - {game.score.away.goals}
                            </span>

                            <div>
                                <span>{game.formattedDate}</span>
                                <span>{game.championship}</span>
                                <span>{game.type}</span>
                            </div>

                            <div>
                                <img src={game.teams.away.logo} alt={game.teams.away.name}/>
                                <span>{game.teams.away.name}</span>
                            </div>
                        </li>
                    ))
                ) : <p>No games found.</p>}
            </ul>
            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
        </>
    );
};

export default SavedGamesPage;