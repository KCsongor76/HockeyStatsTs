import React, {useMemo, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {GameService} from "../OOP/services/GameService";
import {TeamService} from "../OOP/services/TeamService";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import {CREATE} from "../OOP/constants/NavigationNames";
import EntityListItem from "../components/EntityListItem";
import {Team} from "../OOP/classes/Team";
import {Game} from "../OOP/classes/Game";
import {useFilterPagination} from "../hooks/useFilterPagination";

interface LoaderData {
    teams: Team[];
    games: Game[];
}

interface TeamFilterCriteria {
    name: string;
    season: string;
    championship: string;
}

const TeamCrudPage = () => {
    const loaderData = useLoaderData() as LoaderData;
    const [teams, setTeams] = useState<Team[]>(loaderData.teams);
    const games = loaderData.games;
    const {
        filters,
        handleFilterChange,
        pagination,
        setPagination,
        paginate
    } = useFilterPagination<Team, TeamFilterCriteria>({name: '', season: '', championship: ''});
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
            (!seasonTeamIDs || seasonTeamIDs.has(team.id)) &&
            (team.id !== 'free-agent')
        );
    }, [teams, filters, seasonTeamIDs]);

    // Pagination Logic
    const {currentItems: currentTeams, totalPages} = useMemo(() => paginate(filteredTeams), [filteredTeams, paginate]);

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

    // Filter Options
    const seasonOptions = [
        {value: "", label: "All Seasons"},
        ...Object.values(Season).map(s => ({value: s, label: s}))
    ];
    const championshipOptions = [
        {value: "", label: "All Championships"},
        ...Object.values(Championship).map(c => ({value: c, label: c}))
    ];

    return (
        <>
            <h1>Teams</h1>
            <Button styleType={"positive"} onClick={() => navigate(CREATE, {state: {teams}})}>
                Create new Team
            </Button>

            <div>
                <Input
                    id="search"
                    label="Search by Name"
                    hideLabel={true}
                    type="text"
                    placeholder="Search by name..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                />

                <Select
                    id="seasonFilter"
                    label="Filter by Season"
                    value={filters.season}
                    onChange={(e) => handleFilterChange('season', e.target.value)}
                    options={seasonOptions}
                />

                <Select
                    id="championshipFilter"
                    label="Filter by Championship"
                    value={filters.championship}
                    onChange={(e) => handleFilterChange('championship', e.target.value)}
                    options={championshipOptions}
                />
            </div>

            <ul>
                {currentTeams.length > 0 ? currentTeams.map((team: Team) => (
                    <EntityListItem
                        key={team.id}
                        onView={() => navigate(`${team.id}`, {state: {team, games}})}
                        onDelete={() => deleteHandler(team)}
                    >
                        {team.name}
                    </EntityListItem>
                )) : <p>No teams found.</p>}
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