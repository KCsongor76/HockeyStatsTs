import React from 'react';
import {IGameAction} from "../../OOP/interfaces/IGameAction";
import Button from "../Button";
import styles from "./ActionTable.module.css";
import {GameType} from "../../OOP/enums/GameType";
import {GameUtils} from "../../utils/GameUtils";

type SortField = 'type' | 'period' | 'time' | 'team' | 'player';
type SortDirection = 'asc' | 'desc';

interface ActionTableProps {
    actions: IGameAction[];
    gameType: GameType;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onView: (action: IGameAction) => void;
    onDelete: (action: IGameAction) => void;
}

const ActionTable: React.FC<ActionTableProps> = ({
                                                     actions,
                                                     gameType,
                                                     sortField,
                                                     sortDirection,
                                                     onSort,
                                                     onView,
                                                     onDelete
                                                 }) => {

    const renderSortableHeader = (field: SortField, label: string) => (
        <th
            onClick={() => onSort(field)}
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
                {actions.map((action, index) => (
                    <tr key={index}>
                        <td>{action.type}</td>
                        <td>{GameUtils.getPeriodLabel(action.period, gameType)}</td>
                        <td>{GameUtils.formatGameTime(GameUtils.getTotalGameTime(action, gameType))}</td>
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
                                onClick={() => onView(action)}
                            >
                                View
                            </Button>
                        </td>
                        <td>
                            <Button
                                styleType="negative"
                                onClick={() => onDelete(action)}
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

export default ActionTable;