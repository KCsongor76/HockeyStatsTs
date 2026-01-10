import React from 'react';
import {IGame} from "../../OOP/interfaces/IGame";
import styles from "./GameHeader.module.css";

interface GameHeaderProps {
    game: IGame;
}

const GameHeader: React.FC<GameHeaderProps> = ({game}) => {
    return (
        <div className={styles.container}>
            <div className={styles.metaInfo}>
                <span>{game.season}</span>
                <span>•</span>
                <span>{game.championship}</span>
                <span>•</span>
                <span>{game.type}</span>
            </div>

            <div className={styles.scoreboard}>
                <div className={styles.team}>
                    <img src={game.teams?.home.logo} alt="home team" className={styles.teamLogo}/>
                    <span className={styles.teamName}>{game.teams.home.name}</span>
                </div>

                <div className={styles.score}>
                    {game.score.home.goals} - {game.score.away.goals}
                </div>

                <div className={styles.team}>
                    <img src={game.teams?.away.logo} alt="away team" className={styles.teamLogo}/>
                    <span className={styles.teamName}>{game.teams.away.name}</span>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div>
                    <div className={styles.statValue}>{game.score.home.shots}</div>
                    <div className={styles.statValue}>{game.score.home.turnovers}</div>
                    <div className={styles.statValue}>{game.score.home.hits}</div>
                </div>
                <div>
                    <div className={styles.statLabel}>Shots</div>
                    <div className={styles.statLabel}>Turnovers</div>
                    <div className={styles.statLabel}>Hits</div>
                </div>
                <div>
                    <div className={styles.statValue}>{game.score.away.shots}</div>
                    <div className={styles.statValue}>{game.score.away.turnovers}</div>
                    <div className={styles.statValue}>{game.score.away.hits}</div>
                </div>
            </div>
        </div>
    );
};

export default GameHeader;