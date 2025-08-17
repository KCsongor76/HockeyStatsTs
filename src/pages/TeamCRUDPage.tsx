import React, {useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {ITeam} from "../OOP/interfaces/ITeam";
import {IGame} from "../OOP/interfaces/IGame";
import {GameService} from "../OOP/services/GameService";
import {TeamService} from "../OOP/services/TeamService";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";

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

    const seasonTeams = filters.season
        ? new Set(games
            .filter(g => g.season === filters.season)
            .flatMap(g => [g.teams.home.id, g.teams.away.id]))
        : null;

    const filteredTeams = teams.filter(team =>
        (!filters.name || team.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.season || seasonTeams!.has(team.id)) &&
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

    return (
        <div>
            <Button
                styleType={"positive"}
                onClick={() => navigate("create", {state: {teams: teams}})}
            >
                Create New Team
            </Button>

            <Input
                label="Search by name"
                value={filters.name}
                onChange={(e) => setFilters(prevState => ({...prevState, name: e.target.value}))}
                placeholder="Search by name"
            />

            <Select
                label="Filter by season"
                value={filters.season}
                onChange={e => setFilters(prevState => ({...prevState, season: e.target.value}))}
                options={[
                    { value: "", label: "All Seasons" },
                    ...Object.values(Season).map(season => ({
                        value: season,
                        label: season
                    }))
                ]}
            />

            <Select
                label="Filter by championship"
                value={filters.championship}
                onChange={e => setFilters(prevState => ({...prevState, championship: e.target.value}))}
                options={[
                    { value: "", label: "All Championships" },
                    ...Object.values(Championship).map(championship => ({
                        value: championship,
                        label: championship
                    }))
                ]}
            />

            <ul>
                {paginatedTeams.length > 0 ? paginatedTeams.map((team: ITeam) =>
                    <li key={team.id}>
                        <p>{team.name}</p>
                        <Button styleType={"neutral"} onClick={() => navigate(`${team.id}`, {state: {team, games}})}>View</Button>
                        <Button styleType={"negative"} onClick={() => deleteHandler(team)}>Delete</Button>
                    </li>
                ) : <p>No teams found</p>}
            </ul>

            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>

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