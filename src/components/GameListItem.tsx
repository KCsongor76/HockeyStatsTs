import React from 'react';
import {Game} from "../OOP/classes/Game";
import styles from "./GameListItem.module.css";

interface GameListItemProps {
    game: Game;
    onClick: () => void;
    className?: string;
}

const GameListItem = ({game, onClick, className}: GameListItemProps) => {
    return (
        <li onClick={onClick} className={`${styles.item} ${className || ''}`}>
            <div className={styles.team}>
                <img src={game.teams.home.logo} alt={game.teams.home.name} className={styles.logo}/>
                <span className={styles.teamName}>{game.teams.home.name}</span>
            </div>

            <div className={styles.centerContent}>
                <div className={styles.score}>
                    {game.score.home.goals} - {game.score.away.goals}
                </div>
                <div className={styles.meta}>
                    <span className={styles.date}>{game.formattedDate}</span>
                    <span className={styles.badge}>{game.championship}</span>
                    <span className={styles.badge}>{game.type}</span>
                </div>
            </div>

            <div className={styles.team}>
                <img src={game.teams.away.logo} alt={game.teams.away.name} className={styles.logo}/>
                <span className={styles.teamName}>{game.teams.away.name}</span>
            </div>
        </li>
    );
};

export default GameListItem;