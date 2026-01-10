import React, {useMemo} from 'react';
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {Position} from "../OOP/enums/Position";
import styles from './TeamRosterSelector.module.css';

interface TeamRosterSelectorProps {
    teamName: string;
    allPlayers: IPlayer[];
    currentRoster: IPlayer[];
    onChange: (newRoster: IPlayer[]) => void;
    rules: { minSkaters: number, maxSkaters: number, goalies: number };
    error?: string;
}

export const getRosterCounts = (roster: IPlayer[]) => {
    return {
        forwards: roster.filter(p => p.position === Position.FORWARD).length,
        defenders: roster.filter(p => p.position === Position.DEFENDER).length,
        goalies: roster.filter(p => p.position === Position.GOALIE).length
    };
};

const PlayerList = ({
                        title,
                        players,
                        actionIcon,
                        onAction,
                        variant
                    }: {
    title: string,
    players: IPlayer[],
    actionIcon: string,
    onAction: (p: IPlayer) => void,
    variant: 'available' | 'selected'
}) => (
    <div className={styles.group}>
        <div className={styles.groupTitle}>{title}</div>
        <div className={styles.playerList}>
            {players.length === 0 ? (
                <div className={styles.emptyState}>None</div>
            ) : (
                players.map(p => (
                    <div
                        key={p.id}
                        className={`${styles.playerItem} ${variant === 'selected' ? styles.selected : ''}`}
                        onClick={() => onAction(p)}
                    >
                        <div className={styles.playerInfo}>
                            <span className={styles.playerNumber}>{p.jerseyNumber}</span>
                            <span>{p.name}</span>
                        </div>
                        <span className={`${styles.actionIcon} ${variant === 'available' ? styles.add : styles.remove}`}>
                            {actionIcon}
                        </span>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const TeamRosterSelector: React.FC<TeamRosterSelectorProps> = ({
                                                                          teamName,
                                                                          allPlayers,
                                                                          currentRoster,
                                                                          onChange,
                                                                          rules,
                                                                          error
                                                                      }) => {

    const {available, selected, counts} = useMemo(() => {
        const selectedSet = new Set(currentRoster.map(p => p.id));

        const availableList = allPlayers
            .filter(p => !selectedSet.has(p.id))
            .sort((a, b) => a.jerseyNumber - b.jerseyNumber);

        const selectedList = [...currentRoster]
            .sort((a, b) => a.jerseyNumber - b.jerseyNumber);

        return {
            available: availableList,
            selected: selectedList,
            counts: getRosterCounts(selectedList)
        };
    }, [allPlayers, currentRoster]);

    const handleToggle = (player: IPlayer) => {
        const isInRoster = currentRoster.some(p => p.id === player.id);
        const newRoster = isInRoster
            ? currentRoster.filter(p => p.id !== player.id)
            : [...currentRoster, player];

        onChange(newRoster);
    };

    const totalSkaters = counts.defenders + counts.forwards;
    const isGoalieCountValid = counts.goalies === rules.goalies;
    const isSkaterCountValid = totalSkaters >= rules.minSkaters && totalSkaters <= rules.maxSkaters;

    // Helper to filter by position for the view
    const getByPos = (list: IPlayer[], pos: Position) =>
        list.filter(p => p.position === pos);

    const positions = [
        { pos: Position.GOALIE, label: 'Goalies' },
        { pos: Position.DEFENDER, label: 'Defenders' },
        { pos: Position.FORWARD, label: 'Forwards' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>{teamName}</div>

            <div className={styles.grid}>
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <span>Available Players</span>
                        <span className={styles.countBadge}>{available.length}</span>
                    </div>
                    {positions.map(({pos, label}) => (
                        <PlayerList
                            key={`avail-${pos}`}
                            title={label}
                            players={getByPos(available, pos)}
                            actionIcon="+"
                            onAction={handleToggle}
                            variant="available"
                        />
                    ))}
                </div>

                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <span>Selected Roster</span>
                        <span className={styles.countBadge}>{selected.length}</span>
                    </div>
                    {positions.map(({pos, label}) => (
                        <PlayerList
                            key={`sel-${pos}`}
                            title={label}
                            players={getByPos(selected, pos)}
                            actionIcon="−"
                            onAction={handleToggle}
                            variant="selected"
                        />
                    ))}
                </div>
            </div>

            <div className={styles.stats}>
                <div className={`${styles.statItem} ${isGoalieCountValid ? styles.statSuccess : styles.statError}`}>
                    Goalies: {counts.goalies} / {rules.goalies}
                </div>
                <div className={`${styles.statItem} ${isSkaterCountValid ? styles.statSuccess : styles.statError}`}>
                    Skaters: {totalSkaters} / {rules.minSkaters}-{rules.maxSkaters}
                </div>
                {error && <div className={styles.errorMessage}>{error}</div>}
            </div>
        </div>
    );
};