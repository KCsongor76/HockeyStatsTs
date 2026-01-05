import React, {useMemo} from 'react';
import {IPlayer} from "../OOP/interfaces/IPlayer";
import PlayerGroup from "./PlayerGroup";
import {Position} from "../OOP/enums/Position";

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

    // Helper to filter by position for the view
    const getByPos = (list: IPlayer[], pos: Position) =>
        list.filter(p => p.position === pos);

    return (
        <div>
            <h4>{teamName}</h4>
            <h5>Available Players</h5>
            <div>
                <PlayerGroup
                    title="Goalies"
                    players={getByPos(available, Position.GOALIE)}
                    actionLabel="+"
                    onAction={handleToggle}
                />
                <PlayerGroup
                    title="Defenders"
                    players={getByPos(available, Position.DEFENDER)}
                    actionLabel="+"
                    onAction={handleToggle}
                />
                <PlayerGroup
                    title="Forwards"
                    players={getByPos(available, Position.FORWARD)}
                    actionLabel="+"
                    onAction={handleToggle}
                />
            </div>

            <h5>Selected Players</h5>
            <div>
                <PlayerGroup
                    title="Goalies"
                    players={getByPos(selected, Position.GOALIE)}
                    actionLabel="-"
                    onAction={handleToggle}
                />
                <PlayerGroup
                    title="Defenders"
                    players={getByPos(selected, Position.DEFENDER)}
                    actionLabel="-"
                    onAction={handleToggle}
                />
                <PlayerGroup
                    title="Forwards"
                    players={getByPos(selected, Position.FORWARD)}
                    actionLabel="-"
                    onAction={handleToggle}
                />
            </div>

            <div className="roster-stats">
                <div>Goalies: {counts.goalies}/{rules.goalies}</div>
                <div>Skaters: {totalSkaters}/{rules.minSkaters}-{rules.maxSkaters}</div>
                {error && <span style={{color: 'red'}}>{error}</span>}
            </div>
        </div>
    );
};