// PlayerTable.tsx
import React from 'react';
import styles from "../pages/GamePage.module.css";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {Player} from "../OOP/classes/Player";
import {IGame} from "../OOP/interfaces/IGame";
import {useNavigate} from "react-router-dom";
import Button from "./Button";

interface PlayerTableProps {
    pageType: "player" | "team" | "game";
    players?: IPlayer[];
    player?: IPlayer;
    games?: IGame[]
    selectedPlayer?: string | null;
    togglePlayer?: (playerId: string) => void;
}

const PlayerTable: React.FC<PlayerTableProps> = ({
                                                     pageType,
                                                     players = [],
                                                     player,
                                                     games = [],
                                                     selectedPlayer,
                                                     togglePlayer,
                                                 }) => {
    const navigate = useNavigate();
    const renderTableHead = () => {
        if (pageType === "player") {
            return (
                <thead>
                <tr>
                    <th>Name</th>
                    <th>#</th>
                    <th>Position</th>
                    <th>GP</th>
                    <th>G</th>
                    <th>A</th>
                    <th>P</th>
                    <th>S</th>
                    <th>H</th>
                    <th>T</th>
                    <th>S%</th>
                </tr>
                </thead>
            );
        }

        if (pageType === "team") {
            return (
                <thead>
                <tr>
                    <th>Name</th>
                    <th>#</th>
                    <th>Position</th>
                    <th>GP</th>
                    <th>G</th>
                    <th>A</th>
                    <th>P</th>
                    <th>S</th>
                    <th>H</th>
                    <th>T</th>
                    <th>S%</th>
                    <th></th>
                </tr>
                </thead>
            );
        }

        if (pageType === "game") {
            return (
                <thead>
                <tr>
                    <th>Name</th>
                    <th>#</th>
                    <th>G</th>
                    <th>A</th>
                    <th>P</th>
                    <th>S</th>
                    <th>H</th>
                    <th>T</th>
                    <th>S%</th>
                </tr>
                </thead>
            );
        }

        return null;
    };

    const renderTableBody = () => {
        if (pageType === "player" && player) {
            return (
                <tbody>
                <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>{player.jerseyNumber}</td>
                    <td>{player.position}</td>
                    <td>{Player.getPlayerStats(games, player).gamesPlayed || 0}</td>
                    <td>{Player.getPlayerStats(games, player).goals || 0}</td>
                    <td>{Player.getPlayerStats(games, player).assists || 0}</td>
                    <td>{Player.getPlayerStats(games, player).points || 0}</td>
                    <td>{Player.getPlayerStats(games, player).shots || 0}</td>
                    <td>{Player.getPlayerStats(games, player).hits || 0}</td>
                    <td>{Player.getPlayerStats(games, player).turnovers || 0}</td>
                    <td>{(Player.getPlayerStats(games, player).shotPercentage || 0).toFixed(2)}%</td>
                </tr>
                </tbody>
            );
        }

        if (pageType === "team") {
            return (
                <tbody>
                {players.map((player) => (
                    <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player.jerseyNumber}</td>
                        <td>{player.position}</td>
                        <td>{Player.getPlayerStats(games, player).gamesPlayed || 0}</td>
                        <td>{Player.getPlayerStats(games, player).goals || 0}</td>
                        <td>{Player.getPlayerStats(games, player).assists || 0}</td>
                        <td>{Player.getPlayerStats(games, player).points || 0}</td>
                        <td>{Player.getPlayerStats(games, player).shots || 0}</td>
                        <td>{Player.getPlayerStats(games, player).hits || 0}</td>
                        <td>{Player.getPlayerStats(games, player).turnovers || 0}</td>
                        <td>{(Player.getPlayerStats(games, player).shotPercentage || 0).toFixed(2)}%</td>
                        <td>
                            <Button styleType={"neutral"} onClick={() => navigate(`../../handlePlayers/${player.id}`, {
                                state: {player, games}
                            })}>
                                View Player
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            );
        }

        if (pageType === "game") {
            return (
                <tbody>
                {players.map((player) => (
                    <tr
                        key={player.id}
                        className={selectedPlayer === player.id ? styles.selectedRow : ''}
                        onClick={() => togglePlayer?.(player.id)}
                    >
                        <td>{player.name}</td>
                        <td>{player.jerseyNumber}</td>
                        <td>{Player.getPlayerStats(games, player).goals}</td>
                        <td>{Player.getPlayerStats(games, player).assists}</td>
                        <td>{Player.getPlayerStats(games, player).points}</td>
                        <td>{Player.getPlayerStats(games, player).shots}</td>
                        <td>{Player.getPlayerStats(games, player).hits}</td>
                        <td>{Player.getPlayerStats(games, player).turnovers}</td>
                        <td>{Player.getPlayerStats(games, player).shotPercentage.toFixed(2)}%</td>
                    </tr>
                ))}
                </tbody>
            );
        }

        return null;
    };

    return (
        <table>
            {renderTableHead()}
            {renderTableBody()}
        </table>
    );
};

export default PlayerTable;