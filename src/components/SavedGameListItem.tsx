import React from 'react';
import {useNavigate} from "react-router-dom";
import {Game} from "../OOP/classes/Game";
import {SAVED_GAMES} from "../OOP/constants/NavigationNames";

interface SavedGameListItemProps {
    game: Game;
}

const SavedGameListItem = ({game}: SavedGameListItemProps) => {
    const navigate = useNavigate();

    return (
        <li
            onClick={() => navigate(`/${SAVED_GAMES}/${game.id}`, {state: game})}
        >
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

export default SavedGameListItem;