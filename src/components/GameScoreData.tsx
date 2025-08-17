import React from 'react';
import {IGame} from "../OOP/interfaces/IGame";
import {IScoreData} from "../OOP/interfaces/IScoreData";

interface Props {
    game: Partial<IGame>;
    score: { home: IScoreData, away: IScoreData }
}

const GameScoreData = ({game, score}: Props) => {
    return (
        <div>
            <p>Season: {game.season}</p>
            <p>Championship: {game.championship}</p>
            <p>Game type: {game.type}</p>
            <p>Score: {score.home.goals} - {score.away.goals}</p>

            <img src={game.teams?.home.logo} alt="home team"/>
            <p>Shots: {score.home.shots}</p>
            <p>Turnovers: {score.home.turnovers}</p>
            <p>Hits: {score.home.hits}</p>

            <img src={game.teams?.away.logo} alt="away team"/>
            <p>Shots: {score.away.shots}</p>
            <p>Turnovers: {score.away.turnovers}</p>
            <p>Hits: {score.away.hits}</p>
        </div>
    );
};

export default GameScoreData;