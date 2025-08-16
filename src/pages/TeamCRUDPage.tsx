import React, {useEffect, useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {useLoaderData, useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {GameService} from "../OOP/services/GameService";
import {IGame} from "../OOP/interfaces/IGame";
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";

const TeamCrudPage = () => {
    const loaderData = useLoaderData() as {
        teams: ITeam[],
        games: IGame[]
    };
    const [teams, setTeams] = useState<ITeam[]>(loaderData.teams);
    const games = loaderData.games;
    const [filters, setFilters] = useState({search: '', season: '', championship: ''});
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const navigate = useNavigate();
    const perPageOptions = [10, 25, 50, 100];

    const filteredTeams = teams.filter(team => {
        // Name filter
        if (filters.search && !team.name.toLowerCase().includes(filters.search.toLowerCase())) {
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
            <button onClick={() => navigate("create", {state: {teams: teams}})}>Create New Team</button>

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

export default TeamCrudPage;

export const loader = async () => {
    const teams = await TeamService.getAllTeams();
    const games = await GameService.getAllGames();
    return {teams, games};
}