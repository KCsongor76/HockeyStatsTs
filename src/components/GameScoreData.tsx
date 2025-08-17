import React from 'react';
import {IGame} from "../OOP/interfaces/IGame";
import {IScoreData} from "../OOP/interfaces/IScoreData";
import styles from "./GameScoreData.module.css"

interface Props {
    game: Partial<IGame>;
    score: { home: IScoreData, away: IScoreData }
}

const GameScoreData = ({game, score}: Props) => {
    return (
        <div className={styles.scoreContainer}>
            <div className={styles.scoreHeader}>
                <div>
                    <p>Season: {game.season}</p>
                    <p>Championship: {game.championship}</p>
                    <p>Game type: {game.type}</p>
                </div>
                <div className={styles.scoreValue}>
                    Score: {score.home.goals} - {score.away.goals}
                </div>
            </div>

            <div className={styles.teamStats}>
                <div className={styles.teamSection}>
                    <div className={styles.teamHeader}>
                        <img src={game.teams?.home.logo} alt="home team" className={styles.teamLogo}/>
                        <h3>Home Team</h3>
                    </div>
                    <div className={styles.statItem}><span>Shots:</span> <span>{score.home.shots}</span></div>
                    <div className={styles.statItem}><span>Turnovers:</span> <span>{score.home.turnovers}</span></div>
                    <div className={styles.statItem}><span>Hits:</span> <span>{score.home.hits}</span></div>
                </div>

                <div className={styles.teamSection}>
                    <div className={styles.teamHeader}>
                        <img src={game.teams?.away.logo} alt="away team" className={styles.teamLogo}/>
                        <h3>Away Team</h3>
                    </div>
                    <div className={styles.statItem}><span>Shots:</span> <span>{score.away.shots}</span></div>
                    <div className={styles.statItem}><span>Turnovers:</span> <span>{score.away.turnovers}</span></div>
                    <div className={styles.statItem}><span>Hits:</span> <span>{score.away.hits}</span></div>
                </div>
            </div>
        </div>
    );
};

export default GameScoreData;