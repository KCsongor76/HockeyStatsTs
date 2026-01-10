import React from 'react';
import styles from './HandleTeamStatsTable.module.css';

export interface HandleTeamStatsData {
    gp: number;
    w: number;
    otw: number;
    l: number;
    otl: number;
    gf: number;
    ga: number;
    gd: number;
    s: number;
    h: number;
    t: number;
}

interface HandleTeamStatsTableProps {
    stats: HandleTeamStatsData;
}

const HandleTeamStatsTable = ({stats}: HandleTeamStatsTableProps) => {
    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
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
                    <th>T</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>{stats.gp}</td>
                    <td>{stats.w}</td>
                    <td>{stats.otw}</td>
                    <td>{stats.l}</td>
                    <td>{stats.otl}</td>
                    <td>{stats.gf}</td>
                    <td>{stats.ga}</td>
                    <td>{stats.gd}</td>
                    <td>{stats.s}</td>
                    <td>{stats.h}</td>
                    <td>{stats.t}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default HandleTeamStatsTable;