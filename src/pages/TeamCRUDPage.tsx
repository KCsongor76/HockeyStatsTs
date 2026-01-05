import React, {useEffect, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {ITeam} from "../OOP/interfaces/ITeam";
import {IGame} from "../OOP/interfaces/IGame";
import {GameService} from "../OOP/services/GameService";
import {TeamService} from "../OOP/services/TeamService";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import {CREATE} from "../OOP/constants/NavigationNames";

const TeamCrudPage = () => {
    const loaderData = useLoaderData() as { teams: ITeam[], games: IGame[] };
    const [teams, setTeams] = useState<ITeam[]>(loaderData.teams);
    const games = loaderData.games;
    const [filters, setFilters] = useState({name: '', season: '', championship: ''});
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const navigate = useNavigate();

    const seasonTeamIDs = filters.season
        ? new Set(games
            .filter(g => g.season === filters.season)
            .flatMap(g => [g.teams.home.id, g.teams.away.id]))
        : null;

    const filteredTeams = teams.filter(team =>
        (!filters.name || team.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.season || seasonTeamIDs!.has(team.id)) &&
        (!filters.championship || team.championships?.includes(filters.championship as Championship))
    );

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

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div>
            <div>
                <h1>Teams Management</h1>
                <Button
                    styleType={"positive"}
                    onClick={() => navigate(CREATE, {state: {teams: teams}})}
                >
                    Create New Team
                </Button>
            </div>

            <div>
                <div>
                    <label htmlFor="nameSearch">Search by name</label>
                    <input
                        id="nameSearch"
                        value={filters.name}
                        onChange={(e) => setFilters(prevState => ({...prevState, name: e.target.value}))}
                        placeholder="Search by name"
                    />
                </div>

                <div>
                    <label htmlFor="seasonFilter">Filter by season</label>
                    <select
                        id="seasonFilter"
                        value={filters.season}
                        onChange={e => setFilters(prevState => ({...prevState, season: e.target.value}))}
                    >
                        <option value="">All Seasons</option>
                        {Object.values(Season).map(season => (
                            <option key={season} value={season}>{season}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="championshipFilter">Filter by championship</label>
                    <select
                        id="championshipFilter"
                        value={filters.championship}
                        onChange={e => setFilters(prevState => ({...prevState, championship: e.target.value}))}
                    >
                        <option value="">All Championships</option>
                        {Object.values(Championship).map(champ => (
                            <option key={champ} value={champ}>{champ}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ul>
                {paginatedTeams.length > 0 ? (
                    <>
                        {/* Free Agent item - always shown first */}
                        {paginatedTeams.filter(t => t.id === "free-agent").map((team: ITeam) => (
                            <li key={team.id}>
                                <div>
                                    <p>{team.name}</p>
                                </div>
                                <div>
                                    <Button styleType={"neutral"}
                                            onClick={() => navigate(`${team.id}`, {state: {team, games}})}>
                                        View
                                    </Button>
                                    {/* No delete button for free agents */}
                                </div>
                            </li>
                        ))}

                        {/* Regular teams */}
                        {paginatedTeams
                            .filter(t => t.id !== "free-agent")
                            .map((team: ITeam) => (
                                <li key={team.id}>
                                    <div>
                                        <p>{team.name}</p>
                                    </div>
                                    <div>
                                        <Button styleType={"neutral"}
                                                onClick={() => navigate(`${team.id}`, {state: {team, games}})}>
                                            View
                                        </Button>
                                        <Button styleType={"negative"} onClick={() => deleteHandler(team)}>
                                            Delete
                                        </Button>
                                    </div>
                                </li>
                            ))
                        }
                    </>
                ) : <p>No teams found</p>}
            </ul>

            <div>
                <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
            </div>

            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
        </div>
    );
};

export default TeamCrudPage;

export const loader = async () => {
    const teams = await TeamService.getAllTeams();
    const games = await GameService.getAllGames();
    return {teams, games};
}