import React, {useMemo, useState} from 'react';
import Button from "../components/Button";
import {useLoaderData, useNavigate} from "react-router-dom";
import {CREATE} from "../OOP/constants/NavigationNames";
import {Team} from "../OOP/classes/Team";
import {TeamService} from "../OOP/services/TeamService";
import {GameService} from "../OOP/services/GameService";
import {Game} from "../OOP/classes/Game";
import {useFilter} from "../hooks/useFilter";
import Input from "../components/Input";
import Select from "../components/Select";
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import PaginatedList from "../components/PaginatedList";

interface LoaderData {
    teams: Team[];
    games: Game[];
}

const TeamCrudPage2 = () => {
    const loaderData = useLoaderData() as LoaderData;
    const [teams, setTeams] = useState<Team[]>(loaderData.teams ?? []);
    const games = loaderData.games ?? [];

    const {filters, handleFilterChange} = useFilter({
        name: '',
        season: '',
        championship: ''
    });

    const navigate = useNavigate();

    const deleteHandler = async (team: Team) => {
        if (window.confirm(`Are you sure you want to delete ${team.name}?`)) {
            try {
                await TeamService.deleteTeam(team.id);
                alert("Team deleted successfully.")
                // Update local state to reflect deletion without reloading
                setTeams(prev => prev.filter(t => t.id !== team.id));
            } catch (error) {
                console.error("Failed to delete team", error);
                alert("Failed to delete team.");
            }
        }
    };

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
            <Button
                styleType={"positive"}
                onClick={() => navigate(CREATE, {state: {teams}})}
            >
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

            <PaginatedList
                data={filteredTeams}
                renderEmpty={() => <p>No teams found.</p>}
                renderItem={(team: Team) => (
                    <li key={team.id}>
                        {team.name}

                        <Button
                            styleType={"positive"}
                            onClick={() => navigate(`${team.id}`, {state: {team}})}
                        >
                            View
                        </Button>

                        <Button
                            styleType={"neutral"}
                            onClick={() => navigate(`${team.id}/edit`, {state: {team}})}
                        >
                            Edit
                        </Button>

                        <Button
                            styleType={"negative"}
                            onClick={() => deleteHandler(team)}
                        >
                            Delete
                        </Button>
                    </li>
                )}
            />

            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
        </>
    );
};

export default TeamCrudPage2;

export const loader = async (): Promise<LoaderData> => {
    const [teams, games] = await Promise.all([
        TeamService.getAllTeams(),
        GameService.getAllGames()
    ]);
    return {teams, games};
}