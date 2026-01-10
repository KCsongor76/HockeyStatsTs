import React, {useState} from 'react';
import Button from "../Button";
import {Player} from "../../OOP/classes/Player";
import styles from './HandlePlayerStatsTable.module.css';

export interface HandlePlayerStatsData {
    player?: Player;
    name: string;
    jerseyNumber: number;
    position: string;
    gp: number;
    g: number;
    a: number;
    p: number;
    s: number;
    h: number;
    t: number;
    id?: string;
}

interface HandlePlayerStatsTableProps {
    players: HandlePlayerStatsData[];
    onView?: (player: HandlePlayerStatsData) => void;
}

type SortField = keyof HandlePlayerStatsData;

const HandlePlayerStatsTable = ({players, onView}: HandlePlayerStatsTableProps) => {
    const [sortField, setSortField] = useState<SortField>('p');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedPlayers = [...players].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (valA === undefined || valB === undefined) return 0;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const renderHeader = (field: SortField, label: string) => (
        <th onClick={() => handleSort(field)}>
            {label} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
    );

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                <tr>
                    {renderHeader('name', 'Name')}
                    {renderHeader('jerseyNumber', '#')}
                    {renderHeader('position', 'Position')}
                    {renderHeader('gp', 'GP')}
                    {renderHeader('g', 'G')}
                    {renderHeader('a', 'A')}
                    {renderHeader('p', 'P')}
                    {renderHeader('s', 'S')}
                    {renderHeader('h', 'H')}
                    {renderHeader('t', 'T')}
                    {onView && <th>View</th>}
                </tr>
                </thead>
                <tbody>
                {sortedPlayers.map((player, index) => (
                    <tr key={player.id || index}>
                        <td>{player.name}</td>
                        <td>{player.jerseyNumber}</td>
                        <td>{player.position}</td>
                        <td>{player.gp}</td>
                        <td>{player.g}</td>
                        <td>{player.a}</td>
                        <td>{player.p}</td>
                        <td>{player.s}</td>
                        <td>{player.h}</td>
                        <td>{player.t}</td>
                        {onView && (
                            <td className={styles.viewCell}>
                                <Button styleType="neutral" onClick={() => onView(player)}>
                                    View
                                </Button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default HandlePlayerStatsTable;