import React from 'react';
import { IPlayer } from '../OOP/interfaces/IPlayer';
import { ITeam } from '../OOP/interfaces/ITeam';
import styles from './PlayerSelectorModal.module.css';

interface Props {
    isOpen: boolean;
    team?: ITeam;
    excludedPlayer?: IPlayer;
    onClose: () => void;
    onSelect: (player: IPlayer) => void;
}

const PlayerSelectorModal = ({ isOpen, team, onClose, onSelect }: Props) => {
    if (!isOpen || !team) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>Select Player ({team.name})</h3>
                <div className={styles.rosterGrid}>
                    {team.players.map(player => (
                        <div
                            key={player.id}
                            className={styles.playerCard}
                            onClick={() => onSelect(player)}
                        >
                            <div>#{player.jerseyNumber}</div>
                            <div>{player.name}</div>
                            <div>{player.position}</div>
                        </div>
                    ))}
                </div>
                <div className={styles.modalActions}>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default PlayerSelectorModal;