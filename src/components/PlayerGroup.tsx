import {IPlayer} from "../OOP/interfaces/IPlayer";
import React from "react";

interface PlayerGroupProps {
    title: string;
    players: IPlayer[];
    actionLabel: string; // "+", "-"
    onAction: (player: IPlayer) => void;
}

const PlayerGroup: React.FC<PlayerGroupProps> = ({title, players, actionLabel, onAction}) => {
    if (players.length === 0) return null;

    return (
        <div>
            <h6>{title}</h6>
            {players.map(player => (
                <div key={player.id} onClick={() => onAction(player)}>
                    <div>{actionLabel}</div>#{player.jerseyNumber} - {player.name}
                </div>
            ))}
        </div>
    );
};

export default PlayerGroup