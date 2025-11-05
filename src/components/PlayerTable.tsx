import React, {useState} from 'react';
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {Player} from "../OOP/classes/Player";
import {IGame} from "../OOP/interfaces/IGame";
import {useNavigate} from "react-router-dom";
import Button from "./Button";
import styles from "./PlayerTable.module.css";

interface PlayerTableProps {
    pageType: "player" | "team" | "game";
    players?: IPlayer[];
    player?: IPlayer;
    games?: IGame[]
    selectedPlayer?: string | null;
    togglePlayer?: (playerId: string) => void;
}

type SortDirection = 'asc' | 'desc';
type SortableField =
    'name'
    | 'jerseyNumber'
    | 'position'
    | 'gamesPlayed'
    | 'goals'
    | 'assists'
    | 'points'
    | 'shots'
    | 'hits'
    | 'turnovers'
    | 'shotPercentage';

const PlayerTable: React.FC<PlayerTableProps> = ({
                                                     pageType,
                                                     players = [],
                                                     player,
                                                     games = [],
                                                     selectedPlayer,
                                                     togglePlayer,
                                                 }) => {
    const navigate = useNavigate();
    const [sortField, setSortField] = useState<SortableField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (field: SortableField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortPlayers = (playersToSort: IPlayer[]) => {
        return [...playersToSort].sort((a, b) => {
            if (a.id === 'placeholder') return -1;
            if (b.id === 'placeholder') return 1;

            const statsA = Player.getPlayerStats(games, a);
            const statsB = Player.getPlayerStats(games, b);

            let valueA: any;
            let valueB: any;

            switch (sortField) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'jerseyNumber':
                    valueA = a.jerseyNumber;
                    valueB = b.jerseyNumber;
                    break;
                case 'position':
                    valueA = a.position;
                    valueB = b.position;
                    break;
                case 'gamesPlayed':
                    valueA = statsA.gamesPlayed || 0;
                    valueB = statsB.gamesPlayed || 0;
                    break;
                case 'goals':
                    valueA = statsA.goals || 0;
                    valueB = statsB.goals || 0;
                    break;
                case 'assists':
                    valueA = statsA.assists || 0;
                    valueB = statsB.assists || 0;
                    break;
                case 'points':
                    valueA = statsA.points || 0;
                    valueB = statsB.points || 0;
                    break;
                case 'shots':
                    valueA = statsA.shots || 0;
                    valueB = statsB.shots || 0;
                    break;
                case 'hits':
                    valueA = statsA.hits || 0;
                    valueB = statsB.hits || 0;
                    break;
                case 'turnovers':
                    valueA = statsA.turnovers || 0;
                    valueB = statsB.turnovers || 0;
                    break;
                case 'shotPercentage':
                    valueA = statsA.shotPercentage || 0;
                    valueB = statsB.shotPercentage || 0;
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const renderSortableHeader = (field: SortableField, label: string) => {
        return (
            <th
                onClick={() => handleSort(field)}
                style={{cursor: 'pointer'}}
            >
                {label}
                {sortField === field && (
                    <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
            </th>
        );
    };

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
                    {renderSortableHeader('name', 'Name')}
                    {renderSortableHeader('jerseyNumber', '#')}
                    {renderSortableHeader('position', 'Position')}
                    {renderSortableHeader('gamesPlayed', 'GP')}
                    {renderSortableHeader('goals', 'G')}
                    {renderSortableHeader('assists', 'A')}
                    {renderSortableHeader('points', 'P')}
                    {renderSortableHeader('shots', 'S')}
                    {renderSortableHeader('hits', 'H')}
                    {renderSortableHeader('turnovers', 'T')}
                    {renderSortableHeader('shotPercentage', 'S%')}
                    <th></th>
                </tr>
                </thead>
            );
        }

        if (pageType === "game") {
            return (
                <thead>
                <tr>
                    {renderSortableHeader('name', 'Name')}
                    {renderSortableHeader('jerseyNumber', '#')}
                    {renderSortableHeader('goals', 'G')}
                    {renderSortableHeader('assists', 'A')}
                    {renderSortableHeader('points', 'P')}
                    {renderSortableHeader('shots', 'S')}
                    {renderSortableHeader('hits', 'H')}
                    {renderSortableHeader('turnovers', 'T')}
                    {renderSortableHeader('shotPercentage', 'S%')}
                </tr>
                </thead>
            );
        }

        return null;
    };

    const renderTableBody = () => {
        const sortedPlayers = sortPlayers(players);

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
                {sortedPlayers.map((player) => (
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
                {sortedPlayers.map((player) => (
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
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                {renderTableHead()}
                {renderTableBody()}
            </table>
        </div>
    );
};

export default PlayerTable;