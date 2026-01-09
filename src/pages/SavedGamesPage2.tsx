import React, {useEffect, useMemo, useState} from 'react';
import {Game, GameFilterCriteria} from "../OOP/classes/Game";
import {SAVED_GAMES} from "../OOP/constants/NavigationNames";
import {useNavigate} from "react-router-dom";
import {GameService} from "../OOP/services/GameService";
import LoadingSpinner from "../components/LoadingSpinner";
import {useFilter} from "../hooks/useFilter";
import Select from "../components/Select";
import {TeamService} from "../OOP/services/TeamService";
import {Team} from "../OOP/classes/Team";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {GameType} from "../OOP/enums/GameType";
import PaginatedList from "../components/PaginatedList";

interface SavedGamesPageProps {
    playerGames?: Game[];
    showFilters?: boolean;
}

const SavedGamesPage2 = ({playerGames, showFilters}: SavedGamesPageProps) => {
    const navigate = useNavigate();
    const [fetchedGames, setFetchedGames] = useState<Game[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(!playerGames);
    const [error, setError] = useState<string | null>(null);

    const {filters, handleFilterChange} = useFilter<GameFilterCriteria>({
        homeTeamId: "",
        awayTeamId: "",
        championship: "",
        season: "",
        gameType: ""
    });

    useEffect(() => {
        if (!playerGames) {
            const fetchGames = async () => {
                try {
                    setIsLoading(true);
                    const data = await GameService.getAllGames();
                    setFetchedGames(data);
                } catch (err) {
                    console.error("Failed to fetch games:", err);
                    setError("Failed to load games data.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchGames();
        }
    }, [playerGames]);

    useEffect(() => {
        if (showFilters) {
            const fetchTeams = async () => {
                const data = await TeamService.getAllTeams();
                setTeams(data);
            };
            fetchTeams();
        }
    }, [showFilters]);

    const games = playerGames ?? fetchedGames;

    const filteredGames = useMemo(() => {
        return Game.filter(games, filters);
    }, [games, filters]);

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

    if (isLoading) return <LoadingSpinner/>;
    if (error) return <div>{error}</div>;

    return (
        <>
            {showFilters && (
                <div>
                    <Select
                        id="homeTeam"
                        label="Home Team"
                        value={filters.homeTeamId}
                        onChange={(e) => handleFilterChange("homeTeamId", e.target.value)}
                        options={teamOptions}
                    />
                    <Select
                        id="awayTeam"
                        label="Away Team"
                        value={filters.awayTeamId}
                        onChange={(e) => handleFilterChange("awayTeamId", e.target.value)}
                        options={teamOptions}
                    />
                    <Select
                        id="championship"
                        label="Championship"
                        value={filters.championship}
                        onChange={(e) => handleFilterChange("championship", e.target.value)}
                        options={championshipOptions}
                    />
                    <Select
                        id="season"
                        label="Season"
                        value={filters.season}
                        onChange={(e) => handleFilterChange("season", e.target.value)}
                        options={seasonOptions}
                    />
                    <Select
                        id="gameType"
                        label="Game Type"
                        value={filters.gameType}
                        onChange={(e) => handleFilterChange("gameType", e.target.value)}
                        options={gameTypeOptions}
                    />
                </div>
            )}

            <PaginatedList
                data={filteredGames}
                renderEmpty={() => <p>No games found.</p>}
                renderItem={(game: Game) => (
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
                )}
            />
        </>
    );
};

export default SavedGamesPage2;