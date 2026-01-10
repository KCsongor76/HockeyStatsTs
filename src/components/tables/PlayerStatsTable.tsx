import React from 'react';
import Button from "../Button";
import styles from "./PlayerStatsTable.module.css";

export interface PlayerStatsData {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    shots: number;
    hits: number;
    turnovers: number;
    shotPercentage: number;
}

export interface SeasonalPlayerStats {
    season: string;
    stats: PlayerStatsData;
}

export interface RosterPlayer {
    id: string;
    name: string;
    jerseyNumber: number;
    position: string;
    stats: PlayerStatsData;
}

interface PlayerStatsTableProps {
    title: string;
    variant: 'seasonal' | 'roster';

    // Seasonal props
    seasonalStats?: SeasonalPlayerStats[];
    totalStats?: PlayerStatsData;
    showSeasonColumn?: boolean;

    // Roster props
    players?: RosterPlayer[];
    sortConfig?: { field: string; direction: 'asc' | 'desc' };
    onSort?: (field: any) => void;
    onView?: (playerId: string) => void;
    selectedPlayerId?: string | null;
}

const PlayerStatsTable = ({
                              title,
                              variant,
                              seasonalStats = [],
                              totalStats,
                              showSeasonColumn,
                              players = [],
                              sortConfig,
                              onSort,
                              onView,
                              selectedPlayerId
                          }: PlayerStatsTableProps) => {

    const renderSortableHeader = (field: string, label: string) => (
        <th onClick={() => onSort && onSort(field)}>
            {label}
            {sortConfig?.field === field && (<span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>)}
        </th>
    );

    return (
        <div className={styles.container}>
            {title && <h3>{title}</h3>}
            <table className={styles.table}>
                <thead>
                <tr>
                    {variant === 'seasonal' && showSeasonColumn && <th>Season</th>}

                    {variant === 'roster' && (
                        <>
                            {renderSortableHeader('name', 'Name')}
                            {renderSortableHeader('jerseyNumber', '#')}
                            {renderSortableHeader('position', 'Pos')}
                        </>
                    )}

                    {variant === 'roster' ? renderSortableHeader('gamesPlayed', 'GP') : <th>GP</th>}
                    {variant === 'roster' ? renderSortableHeader('goals', 'G') : <th>G</th>}
                    {variant === 'roster' ? renderSortableHeader('assists', 'A') : <th>A</th>}
                    {variant === 'roster' ? renderSortableHeader('points', 'P') : <th>P</th>}
                    {variant === 'roster' ? renderSortableHeader('shots', 'S') : <th>S</th>}
                    {variant === 'roster' ? renderSortableHeader('hits', 'H') : <th>H</th>}
                    {variant === 'roster' ? renderSortableHeader('turnovers', 'T') : <th>T</th>}
                    {variant === 'roster' ? renderSortableHeader('shotPercentage', 'S%') : <th>S%</th>}

                </tr>
                </thead>
                <tbody>
                {variant === 'seasonal' && (
                    <>
                        {showSeasonColumn && seasonalStats.map((row) => (
                            <tr key={row.season}>
                                <td>{row.season}</td>
                                <td>{row.stats.gamesPlayed}</td>
                                <td>{row.stats.goals}</td>
                                <td>{row.stats.assists}</td>
                                <td>{row.stats.points}</td>
                                <td>{row.stats.shots}</td>
                                <td>{row.stats.hits}</td>
                                <td>{row.stats.turnovers}</td>
                                <td>{row.stats.shotPercentage.toFixed(2)}%</td>
                            </tr>
                        ))}
                        {totalStats && (
                            <tr>
                                {showSeasonColumn && <td>Total</td>}
                                <td>{totalStats.gamesPlayed}</td>
                                <td>{totalStats.goals}</td>
                                <td>{totalStats.assists}</td>
                                <td>{totalStats.points}</td>
                                <td>{totalStats.shots}</td>
                                <td>{totalStats.hits}</td>
                                <td>{totalStats.turnovers}</td>
                                <td>{totalStats.shotPercentage.toFixed(2)}%</td>
                            </tr>
                        )}
                    </>
                )}

                {variant === 'roster' && players.map((p) => (
                    <tr
                        key={p.id}
                        onClick={() => onView && onView(p.id)}
                        style={{cursor: onView ? 'pointer' : 'default', backgroundColor: selectedPlayerId === p.id ? '#e0f2fe' : undefined}}
                        className={selectedPlayerId === p.id ? styles.selectedRow : undefined}
                    >
                        <td>{p.name}</td>
                        <td>{p.jerseyNumber}</td>
                        <td>{p.position}</td>
                        <td>{p.stats.gamesPlayed || 0}</td>
                        <td>{p.stats.goals || 0}</td>
                        <td>{p.stats.assists || 0}</td>
                        <td>{p.stats.points || 0}</td>
                        <td>{p.stats.shots || 0}</td>
                        <td>{p.stats.hits || 0}</td>
                        <td>{p.stats.turnovers || 0}</td>
                        <td>{(p.stats.shotPercentage || 0).toFixed(2)}%</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default PlayerStatsTable;