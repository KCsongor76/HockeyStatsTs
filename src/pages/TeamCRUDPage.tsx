import React, {useMemo, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {GameService} from "../OOP/services/GameService";
import {TeamService} from "../OOP/services/TeamService";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import {CREATE} from "../OOP/constants/NavigationNames";
import {Team} from "../OOP/classes/Team";
import {Game} from "../OOP/classes/Game";

interface LoaderData {
    teams: Team[];
    games: Game[];
}

const TeamCrudPage = () => {
    const loaderData = useLoaderData() as LoaderData;
    const [teams, setTeams] = useState<Team[]>(loaderData.teams);
    const games = loaderData.games;
    const [filters, setFilters] = useState({name: '', season: '', championship: ''});
    const [pagination, setPagination] = useState({page: 1, perPage: 10});
    const navigate = useNavigate();

    const seasonTeamIDs = useMemo(() => {
        if (!filters.season) return null;

        const activeGameTeams = games
            .filter(g => g.season === filters.season)
            .flatMap(g => [g.teams.home.id, g.teams.away.id]);

        return new Set(activeGameTeams);
    }, [games, filters.season]);

    const filteredTeams = useMemo(() => {
        return teams.filter(team =>
            (!filters.name || team.name.toLowerCase().includes(filters.name.toLowerCase())) &&
            (!filters.championship || team.championships.includes(filters.championship as Championship)) &&
            (!seasonTeamIDs || seasonTeamIDs.has(team.id))
        );
    }, [teams, filters, seasonTeamIDs]);

    // Pagination Logic
    const {currentTeams, totalPages} = useMemo(() => {
        const indexOfLastTeam = pagination.page * pagination.perPage;
        const indexOfFirstTeam = indexOfLastTeam - pagination.perPage;
        return {
            currentTeams: filteredTeams.slice(indexOfFirstTeam, indexOfLastTeam),
            totalPages: Math.ceil(filteredTeams.length / pagination.perPage)
        };
    }, [filteredTeams, pagination]);

    const deleteHandler = async (team: Team) => {
        if (window.confirm(`Are you sure you want to delete ${team.name}?`)) {
            try {
                await TeamService.deleteTeam(team.id);
                // Update local state to reflect deletion without reloading
                setTeams(prev => prev.filter(t => t.id !== team.id));
            } catch (error) {
                console.error("Failed to delete team", error);
                alert("Failed to delete team.");
            }
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
        setPagination(prev => ({...prev, page: 1})); // Reset to page 1 on filter change
    };

    return (
        <>
            <h1>Teams</h1>
            <Button styleType={"positive"} onClick={() => navigate(CREATE, {state: {teams}})}>
                Create new Team
            </Button>


            <input
                type="text"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
            />

            <select
                value={filters.season}
                onChange={(e) => handleFilterChange('season', e.target.value)}
            >
                <option value="">All Seasons</option>
                {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
                value={filters.championship}
                onChange={(e) => handleFilterChange('championship', e.target.value)}
            >
                <option value="">All Championships</option>
                {Object.values(Championship).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <ul>
                {currentTeams.length > 0 ? (
                    currentTeams
                        .filter(t => t.id !== "free-agent")
                        .map((team: Team) => (
                            <li key={team.id}>
                                <p>{team.name}</p>
                                <Button styleType={"neutral"}
                                        onClick={() => navigate(`${team.id}`, {state: {team, games}})}>
                                    View
                                </Button>
                                <Button styleType={"negative"} onClick={() => deleteHandler(team)}>
                                    Delete
                                </Button>
                            </li>
                        ))
                ) : <p>No teams found</p>}
            </ul>

            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>
            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
        </>
    );
};

export default TeamCrudPage;

export const loader = async (): Promise<LoaderData> => {
    const [teams, games] = await Promise.all([
        TeamService.getAllTeams(),
        GameService.getAllGames()
    ]);

    return {teams, games};
}