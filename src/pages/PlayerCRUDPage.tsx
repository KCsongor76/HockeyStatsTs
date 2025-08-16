import React, {useEffect, useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {useLoaderData, useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {GameService} from "../OOP/services/GameService";
import {IGame} from "../OOP/interfaces/IGame";
import {Season} from "../OOP/enums/Season";
import {PlayerService} from "../OOP/services/PlayerService";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {Position} from "../OOP/enums/Position";

const PlayerCrudPage = () => {
    const loaderData = useLoaderData() as {
        teams: ITeam[],
        players: IPlayer[],
        games: IGame[]
    };
    const teams = loaderData.teams;
    const games = loaderData.games;
    const [players, setPlayers] = useState<IPlayer[]>(loaderData.players)
    const [filters, setFilters] = useState({team: '', position: '', jerseyNr: '', search: '', season: ''});
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const navigate = useNavigate();
    const perPageOptions = [10, 25, 50, 100];

    // Update the filteredPlayers filter logic to include the season filter
    const filteredPlayers = players.filter(player => {
        // Get all games where this player participated (based on teamId)
        const playerGames = games.filter(game =>
            game.teams.home.id === player.teamId ||
            game.teams.away.id === player.teamId
        );

        return (
            (!filters.team || player.teamId === filters.team) &&
            (!filters.position || player.position === filters.position) &&
            (!filters.jerseyNr || player.jerseyNumber.toString().includes(filters.jerseyNr)) &&
            (!filters.search || player.name.toLowerCase().includes(filters.search.toLowerCase())) &&
            (!filters.season || playerGames.some(game => game.season === filters.season))
        );
    });

    const totalPages = Math.ceil(filteredPlayers.length / pagination.perPage);
    const paginatedPlayers = filteredPlayers.slice(
        (pagination.page - 1) * pagination.perPage,
        pagination.page * pagination.perPage
    );

    const deleteHandler = async (player: IPlayer) => {
        if (window.confirm(`Delete ${player.name}?`)) {
            await PlayerService.deletePlayer(player.teamId, player.id);
            // Update local state to remove deleted player
            setPlayers(prev => prev.filter(p => p.id !== player.id));
        }
    };

    const goToPreviousPage = () => {
        if (pagination.page > 1) {
            setPagination(p => ({...p, page: p.page - 1}));
        }
    };

    const goToNextPage = () => {
        if (pagination.page < totalPages) {
            setPagination(p => ({...p, page: p.page + 1}));
        }
    };

    useEffect(() => {
        // scroll automatically to the bottom on page change or team per page change
        window.scrollTo(0, document.body.scrollHeight);
    }, [pagination.page, pagination.perPage]);

    return (
        <div>
            <button onClick={() => navigate("create", {state: {teams: teams}})}>Create New Player</button>

            <label>
                Search by name
                <input
                    type="text"
                    name="nameSearch"
                    value={filters.search}
                    onChange={e => setFilters(prevState => ({...prevState, search: e.target.value}))}
                    placeholder={"Search by name"}
                />
            </label>

            <label>
                Filter by jersey number
                <input
                    type="number"
                    name="numberFilter"
                    value={filters.jerseyNr}
                    onChange={e => setFilters(prevState => ({...prevState, jerseyNr: e.target.value}))}
                    placeholder={"Search by jersey number"}
                    min={1}
                    max={99}
                />
            </label>

            <label>
                Filter by team
                <select
                    value={filters.team}
                    onChange={e => setFilters(prevState => ({...prevState, team: e.target.value}))}
                >
                    <option key="All Teams" value="">All Teams</option>
                    {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </label>

            <label>
                Filter by position
                <select
                    value={filters.position}
                    onChange={e => setFilters(prevState => ({...prevState, position: e.target.value}))}
                >
                    <option key="All Positions" value="">All Positions</option>
                    {Object.values(Position).map((position) => (
                        <option key={position} value={position}>{position}</option>
                    ))}
                </select>
            </label>

            <label>
                Filter by season
                <select
                    value={filters.season}
                    onChange={e => setFilters(prevState => ({...prevState, season: e.target.value}))}
                >
                    <option key="All Seasons" value="">All Seasons</option>
                    {Object.values(Season).map((season) => (
                        <option key={season} value={season}>{season}</option>
                    ))}
                </select>
            </label>

            <ul>
                {paginatedPlayers.length > 0 ? paginatedPlayers.map((player: IPlayer) =>
                    <li key={player.id}>
                        <p>{player.name}</p>
                        <button onClick={() => navigate(`${player.id}`, {state: {player, games}})}>View</button>
                        <button onClick={() => deleteHandler(player)}>Delete</button>
                    </li>
                ) : <p>No teams found</p>}
            </ul>

            <div>
                <div>
                    <button
                        type="button"
                        disabled={pagination.page === 1}
                        onClick={goToPreviousPage}
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        disabled={pagination.page >= totalPages}
                        onClick={goToNextPage}
                    >
                        Next
                    </button>
                </div>

                <select
                    value={pagination.perPage}
                    onChange={e => setPagination({
                        page: 1,
                        perPage: parseInt(e.target.value)
                    })}
                >
                    {perPageOptions.map(option => (
                        <option key={option} value={option}>
                            {option} per page
                        </option>
                    ))}
                </select>
            </div>

            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );
};

export default PlayerCrudPage;

export const loader = async () => {
    const teams = await TeamService.getAllTeams();
    const players = await PlayerService.getAllPlayers();
    const games = await GameService.getAllGames();
    return {teams, players, games};
}