import React, {useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {ITeam} from "../OOP/interfaces/ITeam";
import {IGame} from "../OOP/interfaces/IGame";
import {GameService} from "../OOP/services/GameService";
import {TeamService} from "../OOP/services/TeamService";
import Pagination from "../components/Pagination";

const TeamCrudPage = () => {
    const loaderData = useLoaderData() as {
        teams: ITeam[],
        games: IGame[]
    };
    const [teams, setTeams] = useState<ITeam[]>(loaderData.teams);
    const games = loaderData.games;
    const [filters, setFilters] = useState({name: '', season: '', championship: ''});
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const navigate = useNavigate();

    const filteredTeams = teams.filter(team => {
        // Name filter
        if (filters.name && !team.name.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }

        // Season filter
        if (filters.season) {
            const seasonTeams = new Set<string>();
            games.forEach(game => {
                if (game.season === filters.season) {
                    seasonTeams.add(game.teams.home.id);
                    seasonTeams.add(game.teams.away.id);
                }
            });
            if (!seasonTeams.has(team.id)) return false;
        }

        // Championship filter
        if (filters.championship) {
            const hasChampionship = team.championships?.some(ch => ch === filters.championship) ?? false;
            if (!hasChampionship) return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredTeams.length / pagination.perPage);
    const paginatedTeams = filteredTeams.slice(
        (pagination.page - 1) * pagination.perPage,
        pagination.page * pagination.perPage
    );

    const deleteHandler = async (team: ITeam) => {
        if (window.confirm(`Delete ${team.name}? Players will become free agents.`)) {
            try {
                await TeamService.deleteTeam(team.id);
                setTeams(prev => prev.filter(t => t.id !== team.id));
                alert("Team deleted successfully. Players moved to free agents.");
            } catch (error) {
                console.error("Error deleting team:", error);
                alert("Failed to delete team. Please try again.");
            }
        }
    };

    return (
        <div>
            <button onClick={() => navigate("create", {state: {teams: teams}})}>Create New Team</button>

            <label>
                Search by name
                <input
                    type="text"
                    name="nameSearch"
                    value={filters.name}
                    onChange={e => setFilters(prevState => ({...prevState, search: e.target.value}))}
                    placeholder={"Search by name"}
                />
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

            <label>
                Filter by championship
                <select
                    value={filters.championship}
                    onChange={e => setFilters(prevState => ({...prevState, championship: e.target.value}))}
                >
                    <option key="All Seasons" value="">All Championships</option>
                    {Object.values(Championship).map((championship) => (
                        <option key={championship} value={championship}>{championship}</option>
                    ))}
                </select>
            </label>

            <ul>
                {paginatedTeams.length > 0 ? paginatedTeams.map((team: ITeam) =>
                    <li key={team.id}>
                        <p>{team.name}</p>
                        <button onClick={() => navigate(`${team.id}`, {state: {team, games}})}>View</button>
                        <button onClick={() => deleteHandler(team)}>Delete</button>
                    </li>
                ) : <p>No teams found</p>}
            </ul>

            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>

            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );
};

export default TeamCrudPage;

export const loader = async () => {
    const teams = await TeamService.getAllTeams();
    const games = await GameService.getAllGames();
    return {teams, games};
}