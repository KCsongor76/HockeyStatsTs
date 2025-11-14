import React, { useState } from 'react';
import { IGameAction } from "../OOP/interfaces/IGameAction";
import { GameType } from "../OOP/enums/GameType";
import { RegularPeriod, PlayoffPeriod } from "../OOP/enums/Period";
import Button from "./Button";
import styles from "./ActionsTable.module.css";

interface Props {
    actions: IGameAction[];
    gameType: GameType;
    onActionEdit: (action: IGameAction) => void;
    onActionDelete: (action: IGameAction) => void;
}

type SortField = 'type' | 'period' | 'time' | 'team' | 'player';
type SortDirection = 'asc' | 'desc';

const ActionsTable: React.FC<Props> = ({ actions, gameType, onActionEdit, onActionDelete }) => {
    const [sortField, setSortField] = useState<SortField>('period');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getPeriodStartTime = (period: number): number => {
        if (gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST: return 0;
                case RegularPeriod.SECOND: return 20 * 60;
                case RegularPeriod.THIRD: return 40 * 60;
                case RegularPeriod.OT: return 60 * 60;
                case RegularPeriod.SO: return 65 * 60;
                default: return (period - 1) * 20 * 60;
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST: return 0;
                case PlayoffPeriod.SECOND: return 20 * 60;
                case PlayoffPeriod.THIRD: return 40 * 60;
                default:
                    // Overtime periods: 60 minutes + (period - 3) * 20 minutes
                    return 60 * 60 + (period - PlayoffPeriod.THIRD) * 20 * 60;
            }
        }
    };

    const getTotalGameTime = (action: IGameAction): number => {
        const periodStart = getPeriodStartTime(action.period);
        return periodStart + action.time;
    };

    const formatGameTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getPeriodLabel = (period: number): string => {
        if (gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST: return '1st';
                case RegularPeriod.SECOND: return '2nd';
                case RegularPeriod.THIRD: return '3rd';
                case RegularPeriod.OT: return 'OT';
                case RegularPeriod.SO: return 'SO';
                default: return `${period}`;
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST: return '1st';
                case PlayoffPeriod.SECOND: return '2nd';
                case PlayoffPeriod.THIRD: return '3rd';
                default: return `OT${period - PlayoffPeriod.THIRD}`;
            }
        }
    };

    const sortedActions = [...actions].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortField) {
            case 'type':
                aValue = a.type;
                bValue = b.type;
                break;
            case 'period':
                aValue = getTotalGameTime(a);
                bValue = getTotalGameTime(b);
                break;
            case 'time':
                aValue = getTotalGameTime(a);
                bValue = getTotalGameTime(b);
                break;
            case 'team':
                aValue = a.team.name;
                bValue = b.team.name;
                break;
            case 'player':
                aValue = a.player.name;
                bValue = b.player.name;
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const renderSortableHeader = (field: SortField, label: string) => (
        <th
            onClick={() => handleSort(field)}
            className={styles.sortableHeader}
        >
            {label}
            {sortField === field && (
                <span className={styles.sortIndicator}>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );

    return (
        <div className={styles.tableContainer}>
            <h3>All Actions</h3>
            <table className={styles.table}>
                <thead>
                <tr>
                    {renderSortableHeader('type', 'Type')}
                    {renderSortableHeader('period', 'Period')}
                    {renderSortableHeader('time', 'Time')}
                    {renderSortableHeader('team', 'Team')}
                    {renderSortableHeader('player', 'Player')}
                    <th>Assists</th>
                    <th>View</th>
                    <th>Delete</th>
                </tr>
                </thead>
                <tbody>
                {sortedActions.map((action, index) => (
                    <tr key={index}>
                        <td>{action.type}</td>
                        <td>{getPeriodLabel(action.period)}</td>
                        <td>{formatGameTime(getTotalGameTime(action))}</td>
                        <td>{action.team.name}</td>
                        <td>#{action.player.jerseyNumber} {action.player.name}</td>
                        <td>
                            {action.assists && action.assists.length > 0
                                ? action.assists.map(a => `#${a.jerseyNumber} ${a.name}`).join(', ')
                                : '-'
                            }
                        </td>
                        <td>
                            <Button
                                styleType="neutral"
                                onClick={() => onActionEdit(action)}
                            >
                                View
                            </Button>
                        </td>
                        <td>
                            <Button
                                styleType="negative"
                                onClick={() => onActionDelete(action)}
                            >
                                Delete
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ActionsTable;