import React from 'react';

interface Props {
    stats: {
        gamesPlayed: number
        wins: number
        otWins: number
        losses: number
        otLosses: number
        goalsFor: number
        goalsAgainst: number
        goalDifference: number
        shots: number
        hits: number
        turnovers: number
        shotPercentage: number
    }
}

const TeamTable = ({stats}: Props) => {
    return (
        <table>
            <thead>
            <tr>
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
            <tr>
                <td>{stats.gamesPlayed}</td>
                <td>{stats.wins}</td>
                <td>{stats.otWins}</td>
                <td>{stats.losses}</td>
                <td>{stats.otLosses}</td>
                <td>{stats.goalsFor}</td>
                <td>{stats.goalsAgainst}</td>
                <td>{stats.goalDifference}</td>
                <td>{stats.shots}</td>
                <td>{stats.hits ? stats.hits : 0}</td>
                <td>{stats.shotPercentage.toFixed(2)}%</td>
            </tr>
            </tbody>
        </table>
    );
};

export default TeamTable;