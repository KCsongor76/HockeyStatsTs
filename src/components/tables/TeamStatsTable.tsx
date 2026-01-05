import React from 'react';

export interface TeamStatsData {
    gamesPlayed: number;
    wins: number;
    otWins: number;
    losses: number;
    otLosses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    shots: number;
    hits: number;
    shotPercentage: number;
}

export interface SeasonalTeamStats {
    season: string;
    stats: TeamStatsData;
}

interface TeamStatsTableProps {
    title: string;
    totalStats: TeamStatsData;
    seasonalStats: SeasonalTeamStats[];
    showSeasonColumn: boolean;
}

const TeamStatsTable = ({
                            title,
                            totalStats,
                            seasonalStats,
                            showSeasonColumn
                        }: TeamStatsTableProps) => {
    return (
        <div>
            <h3>{title}</h3>
            <table>
                <thead>
                <tr>
                    {showSeasonColumn && <th>Season</th>}
                    <th>GP</th>
                    <th>W</th>
                    <th>OTW</th>
                    <th>L</th>
                    <th>OTL</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>S</th>
                    <th>H</th>
                    <th>S%</th>
                </tr>
                </thead>
                <tbody>
                {showSeasonColumn && seasonalStats.map((row) => (
                    <tr key={row.season}>
                        <td>{row.season}</td>
                        <td>{row.stats.gamesPlayed}</td>
                        <td>{row.stats.wins}</td>
                        <td>{row.stats.otWins}</td>
                        <td>{row.stats.losses}</td>
                        <td>{row.stats.otLosses}</td>
                        <td>{row.stats.goalsFor}</td>
                        <td>{row.stats.goalsAgainst}</td>
                        <td>{row.stats.goalDifference}</td>
                        <td>{row.stats.shots}</td>
                        <td>{row.stats.hits || 0}</td>
                        <td>{row.stats.shotPercentage.toFixed(2)}%</td>
                    </tr>
                ))}
                <tr>
                    {showSeasonColumn && <td>Total</td>}
                    <td>{totalStats.gamesPlayed}</td>
                    <td>{totalStats.wins}</td>
                    <td>{totalStats.otWins}</td>
                    <td>{totalStats.losses}</td>
                    <td>{totalStats.otLosses}</td>
                    <td>{totalStats.goalsFor}</td>
                    <td>{totalStats.goalsAgainst}</td>
                    <td>{totalStats.goalDifference}</td>
                    <td>{totalStats.shots}</td>
                    <td>{totalStats.hits || 0}</td>
                    <td>{totalStats.shotPercentage.toFixed(2)}%</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default TeamStatsTable;