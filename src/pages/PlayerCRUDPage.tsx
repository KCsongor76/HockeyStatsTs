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
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import styles from "./PlayerCRUDPage.module.css"

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

    const filteredPlayers = players.filter(player => {
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
            setPlayers(prev => prev.filter(p => p.id !== player.id));
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Players Management</h1>
                <Button
                    styleType={"positive"}
                    onClick={() => navigate("create", {state: {teams: teams}})}
                >
                    Create New Player
                </Button>
            </div>

            <div className={styles.filters}>
                <Input
                    label="Search by name"
                    type="text"
                    name="nameSearch"
                    value={filters.search}
                    onChange={e => setFilters(prevState => ({...prevState, search: e.target.value}))}
                    placeholder="Search by name"
                />

                <Input
                    label="Filter by jersey number"
                    type="number"
                    name="numberFilter"
                    value={filters.jerseyNr}
                    onChange={e => setFilters(prevState => ({...prevState, jerseyNr: e.target.value}))}
                    placeholder="Search by jersey number"
                    min={1}
                    max={99}
                />

                <Select
                    label="Filter by team"
                    value={filters.team}
                    onChange={e => setFilters(prevState => ({...prevState, team: e.target.value}))}
                    options={[
                        {value: "", label: "All Teams"},
                        ...teams.map(team => ({
                            value: team.id,
                            label: team.name
                        }))
                    ]}
                />

                <Select
                    label="Filter by position"
                    value={filters.position}
                    onChange={e => setFilters(prevState => ({...prevState, position: e.target.value}))}
                    options={[
                        {value: "", label: "All Positions"},
                        ...Object.values(Position).map(position => ({
                            value: position,
                            label: position
                        }))
                    ]}
                />

                <Select
                    label="Filter by season"
                    value={filters.season}
                    onChange={e => setFilters(prevState => ({...prevState, season: e.target.value}))}
                    options={[
                        {value: "", label: "All Seasons"},
                        ...Object.values(Season).map(season => ({
                            value: season,
                            label: season
                        }))
                    ]}
                />
            </div>

            <ul className={styles.playerList}>
                {paginatedPlayers.length > 0 ? paginatedPlayers.map((player: IPlayer) =>
                    <li key={player.id} className={styles.playerItem}>
                        <div className={styles.playerInfo}>
                            <p>{player.name} - #{player.jerseyNumber} ({player.position})</p>
                        </div>
                        <div className={styles.playerActions}>
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
                        </div>
                    </li>
                ) : <p>No players found</p>}
            </ul>

            <Pagination pagination={pagination} totalPages={totalPages} setPagination={setPagination}/>

            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
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