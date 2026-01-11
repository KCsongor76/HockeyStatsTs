import React, {useMemo, useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {PlayerService} from "../OOP/services/PlayerService";
import {GameService} from "../OOP/services/GameService";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";
import {Game} from "../OOP/classes/Game";
import {useLoaderData, useNavigate} from "react-router-dom";
import {CREATE} from "../OOP/constants/NavigationNames";
import Button from "../components/Button";
import {useFilter} from "../hooks/useFilter";
import Input from "../components/Input";
import Select from "../components/Select";
import {Season} from "../OOP/enums/Season";
import {Position} from "../OOP/enums/Position";
import PaginatedList from "../components/PaginatedList";
import CrudListItem from "../components/CrudListItem";
import styles from "./PlayerCRUDPage.module.css";


interface LoaderData {
    teams: Team[];
    players: Player[];
    games: Game[];
}

const PlayerCrudPage = () => {
    const navigate = useNavigate();
    const loaderData = useLoaderData() as LoaderData;
    const teams = loaderData.teams ?? [];
    const [players, setPlayers] = useState<Player[]>(loaderData.players ?? []);
    const games = loaderData.games ?? [];

    const {filters, handleFilterChange} = useFilter({
        search: '',
        season: '',
        team: '',
        position: '',
        jerseyNr: ''
    });

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
        return players.filter(player => {
            if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.team && player.teamId !== filters.team) return false;
            if (filters.position && player.position !== filters.position) return false;
            if (filters.jerseyNr && player.jerseyNumber.toString() !== filters.jerseyNr) return false;
            if (teamsActiveInSeason && !teamsActiveInSeason.has(player.teamId)) return false;
            return true;
        });
    }, [players, filters, teamsActiveInSeason]);

    const seasonOptions = [
        {value: "", label: "All Seasons"},
        ...Object.values(Season).map(s => ({value: s, label: s}))
    ];
    const teamOptions = [
        {value: "", label: "All Teams"},
        ...teams.map(t => ({value: t.id, label: t.name}))
    ];
    const positionOptions = [
        {value: "", label: "All Positions"},
        ...Object.values(Position).map(p => ({value: p, label: p}))
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Manage Players</h1>
                <Button
                    styleType={"positive"}
                    onClick={() => navigate(CREATE, {state: {teams}})}
                >
                    Add New Player
                </Button>
            </div>

            <div className={styles.filtersSection}>
                <Input
                    id="search"
                    label="Search Name"
                    hideLabel={true}
                    type="text"
                    placeholder="Search name..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                />

                <Select
                    id="seasonFilter"
                    label="Filter by Season"
                    value={filters.season}
                    onChange={(e) => handleFilterChange('season', e.target.value)}
                    options={seasonOptions}
                />

                <Select
                    id="teamFilter"
                    label="Filter by Team"
                    value={filters.team}
                    onChange={(e) => handleFilterChange('team', e.target.value)}
                    options={teamOptions}
                />

                <Select
                    id="positionFilter"
                    label="Filter by Position"
                    value={filters.position}
                    onChange={(e) => handleFilterChange('position', e.target.value)}
                    options={positionOptions}
                />

                <Input
                    id="jerseyFilter"
                    label="Jersey #"
                    type="number"
                    placeholder="Jersey #"
                    value={filters.jerseyNr}
                    onChange={(e) => handleFilterChange('jerseyNr', e.target.value)}
                />
            </div>

            <div className={styles.listSection}>
                <PaginatedList
                    data={filteredPlayers}
                    renderEmpty={() => <p>No players found.</p>}
                    renderItem={(player: Player) => (
                        <CrudListItem
                            key={player.id}
                            label={player.name}
                            onView={() => navigate(`${player.id}`, {state: {player, games}})}
                            onEdit={() => navigate(`${player.id}/edit`, {state: {player, teams}})}
                            onDelete={() => deleteHandler(player)}
                        />
                    )}
                />
            </div>

            <div className={styles.footer}>
                <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        </div>
    );
};

export default PlayerCrudPage;

export const loader = async (): Promise<LoaderData> => {

    const teams = await TeamService.getAllTeams();
    const games = await GameService.getAllGames();
    // todo: make sure PlayerService returns Player objects
    const playersData = await PlayerService.getAllPlayers()
    const players = playersData.map(p => new Player(p.id, p.jerseyNumber, p.name, p.position, p.teamId));

    return {teams, players, games};
}