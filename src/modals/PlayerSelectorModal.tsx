import React from 'react';
import Button from '../components/Button';
import {IPlayer} from '../OOP/interfaces/IPlayer';
import {ITeam} from '../OOP/interfaces/ITeam';
import styles from './PlayerSelectorModal.module.css';

interface Props {
    isOpen: boolean;
    team?: ITeam;
    excludedPlayer?: IPlayer;
    onClose: () => void;
    onSelect: (player: IPlayer) => void;
    onGoBack?: () => void; // Add this
}

const PlayerSelectorModal = ({isOpen, team, onClose, onSelect, onGoBack}: Props) => {
    if (!isOpen || !team) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>Select Player ({team.name})</h3>
                <div className={styles.rosterGrid}>
                    {team.roster.map(player => (
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
                    {onGoBack && (
                        <Button styleType="negative" onClick={onGoBack}>
                            Go Back
                        </Button>
                    )}
                    <Button styleType="negative" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PlayerSelectorModal;