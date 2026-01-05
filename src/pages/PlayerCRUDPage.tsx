import React, {useMemo, useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {useLoaderData, useNavigate} from "react-router-dom";
import {GameService} from "../OOP/services/GameService";
import {Season} from "../OOP/enums/Season";
import {PlayerService} from "../OOP/services/PlayerService";
import {Position} from "../OOP/enums/Position";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import {CREATE} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";
import {Game} from "../OOP/classes/Game";

interface LoaderData {
    teams: Team[];
    players: Player[];
    games: Game[];
}

const PlayerCrudPage = () => {
    const loaderData = useLoaderData() as LoaderData;

    const [players, setPlayers] = useState<Player[]>(loaderData.players);
    const teams = loaderData.teams;
    const games = loaderData.games;

    const [filters, setFilters] = useState({team: '', position: '', jerseyNr: '', search: '', season: ''});
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const navigate = useNavigate();

    const teamsActiveInSeason = useMemo(() => {
        if (!filters.season) return null;

        const activeTeamIds = new Set<string>();
        games.forEach(g => {
            if (g.season === filters.season) {
                activeTeamIds.add(g.teams.home.id);
                activeTeamIds.add(g.teams.away.id);
            }
        });
        return activeTeamIds;
    }, [games, filters.season]);

    const filteredPlayers = useMemo(() => {
        // todo: make this more readable
        return players.filter(player => {
            if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.team && player.teamId !== filters.team) return false;
            if (filters.position && player.position !== filters.position) return false;
            if (filters.jerseyNr && player.jerseyNumber.toString() !== filters.jerseyNr) return false;
            // If a season is selected, check if the player's team was active in that season.
            return !(teamsActiveInSeason && !teamsActiveInSeason.has(player.teamId));
        });
    }, [players, filters, teamsActiveInSeason]);

    // Pagination Logic
    const {currentPlayers, totalPages} = useMemo(() => {
        const indexOfLast = pagination.page * pagination.perPage;
        const indexOfFirst = indexOfLast - pagination.perPage;
        return {
            currentPlayers: filteredPlayers.slice(indexOfFirst, indexOfLast),
            totalPages: Math.ceil(filteredPlayers.length / pagination.perPage)
        };
    }, [filteredPlayers, pagination]);

    const deleteHandler = async (player: Player) => {
        if (window.confirm(`Are you sure you want to delete ${player.name}?`)) {
            try {
                await PlayerService.deletePlayer(player.teamId, player.id);
                setPlayers(prev => prev.filter(p => p.id !== player.id));
            } catch (error) {
                console.error("Failed to delete player:", error);
                alert("Failed to delete player.");
            }
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, page: 1}));
    };

    return (
        <div>
            <h1>Players Registry</h1>

            <Button styleType={"positive"} onClick={() => navigate(CREATE, {state: {teams}})}>
                Add New Player
            </Button>

            <input
                type="text"
                placeholder="Search name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
            />

            <select value={filters.season} onChange={(e) => handleFilterChange('season', e.target.value)}>
                <option value="">All Seasons</option>
                {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={filters.team} onChange={(e) => handleFilterChange('team', e.target.value)}>
                <option value="">All Teams</option>
                {teams.filter(t => t.id !== 'free-agent').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            <select value={filters.position} onChange={(e) => handleFilterChange('position', e.target.value)}>
                <option value="">All Positions</option>
                {Object.values(Position).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <input
                type="number"
                placeholder="Jersey #"
                value={filters.jerseyNr}
                onChange={(e) => handleFilterChange('jerseyNr', e.target.value)}
            />

            <ul>
                {currentPlayers.length > 0 ? currentPlayers.map((player: Player) => (
                    <li key={player.id}>
                        <p>
                            {player.name}
                            {` #${player.jerseyNumber} (${player.position})`}
                            <span>
                                {teams.find(t => t.id === player.teamId)?.name || 'Unknown Team'}
                            </span>
                        </p>

                        <Button
                            styleType={"neutral"}
                            onClick={() => navigate(`${player.id}`, {state: {player, games}})}
                        >
                            View
                        </Button>
                        <Button
                            styleType={"negative"}
                            onClick={() => deleteHandler(player)}
                        >
                            Delete
                        </Button>
                    </li>
                )) : <p>No players found matching criteria.</p>}
            </ul>

            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );
};

export default PlayerCrudPage;

export const loader = async (): Promise<LoaderData> => {
    const [teamsData, playersData, gamesData] = await Promise.all([
        TeamService.getAllTeams(),
        PlayerService.getAllPlayers(),
        GameService.getAllGames()
    ]);

    const teams = teamsData;
    const games = gamesData;
    const players = playersData.map(p => new Player(p.id, p.jerseyNumber, p.name, p.position, p.teamId));

    return {teams, players, games};
}