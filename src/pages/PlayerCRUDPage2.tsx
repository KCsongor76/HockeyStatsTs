import React, {useState} from 'react';
import {TeamService} from "../OOP/services/TeamService";
import {PlayerService} from "../OOP/services/PlayerService";
import {GameService} from "../OOP/services/GameService";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";
import {Game} from "../OOP/classes/Game";
import {useLoaderData, useNavigate} from "react-router-dom";
import {CREATE} from "../OOP/constants/NavigationNames";
import Button from "../components/Button";
import Pagination from "../components/Pagination";
// todo: searching/filtering


interface LoaderData {
    teams: Team[];
    players: Player[];
    games: Game[];
}

const PlayerCrudPage2 = () => {
    const navigate = useNavigate();
    const loaderData = useLoaderData() as LoaderData;
    const teams = loaderData.teams ?? [];
    const [players, setPlayers] = useState<Player[]>(loaderData.players ?? []);
    const games = loaderData.games ?? [];


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

    return (
        <>
            <Button
                styleType={"positive"}
                onClick={() => navigate(CREATE, {state: {teams}})}
            >
                Add New Player
            </Button>

            {/*  todo: search name  */}
            {/*  todo: filter season  */}
            {/*  todo: filter team  */}
            {/*  todo: filter position  */}
            {/*  todo: filter #  */}
            <ul>
                {players.length > 0 ? players.map((player: Player) => (
                    <li key={player.id}>
                        {player.name}

                        <Button
                            styleType={"positive"}
                            onClick={() => navigate(`${player.id}`, {state: {player, games}})}
                        >
                            View
                        </Button>

                        <Button
                            styleType={"neutral"}
                            onClick={() => navigate(`${player.id}/edit`, {state: {player, teams}})}
                        >
                            Edit
                        </Button>

                        <Button
                            styleType={"negative"}
                            onClick={() => deleteHandler(player)}
                        >
                            Delete
                        </Button>
                    </li>
                )) : <p>No players found.</p>}
            </ul>

            {/*<Pagination pagination={} totalPages={} setPagination={} />*/}
            <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
        </>
    );
};

export default PlayerCrudPage2;

export const loader = async (): Promise<LoaderData> => {

    const teams = await TeamService.getAllTeams();
    const games = await GameService.getAllGames();
    // todo: make sure TeamService returns Player objects
    const playersData = await PlayerService.getAllPlayers()
    const players = playersData.map(p => new Player(p.id, p.jerseyNumber, p.name, p.position, p.teamId));

    return {teams, players, games};
}