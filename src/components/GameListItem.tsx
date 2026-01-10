import React from 'react';
import {Game} from "../OOP/classes/Game";

interface GameListItemProps {
    game: Game;
    onClick: () => void;
}

const GameListItem = ({game, onClick}: GameListItemProps) => {
    return (
        <li onClick={onClick}>
            <div>
                <img src={game.teams.home.logo} alt={game.teams.home.name}/>
                <span>{game.teams.home.name}</span>
            </div>

            <span>
                {game.score.home.goals} - {game.score.away.goals}
            </span>

            <div>
                <span>{game.formattedDate}</span>
                <span>{game.championship}</span>
                <span>{game.type}</span>
            </div>

            <div>
                <img src={game.teams.away.logo} alt={game.teams.away.name}/>
                <span>{game.teams.away.name}</span>
            </div>
        </li>
    );
};

export default GameListItem;