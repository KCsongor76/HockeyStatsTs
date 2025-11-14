import React from 'react';
import Button from '../components/Button';
import {IPlayer} from '../OOP/interfaces/IPlayer';
import {ITeam} from '../OOP/interfaces/ITeam';
import styles from './PlayerSelectorModal.module.css';
import {PLACEHOLDER_PLAYER} from "../OOP/constants/PlaceholderPlayer";

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

    // Add placeholder player to the roster
    const rosterWithPlaceholder = [PLACEHOLDER_PLAYER, ...team.roster];

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>Select Player ({team.name})</h3>
                <div className={styles.rosterGrid}>
                    {rosterWithPlaceholder
                        .sort((a, b) => {
                            // Always keep placeholder at the top
                            if (a.id === 'placeholder') return -1;
                            if (b.id === 'placeholder') return 1;
                            return a.jerseyNumber - b.jerseyNumber;
                        })
                        .map(player => (
                            <div
                                key={player.id}
                                className={styles.playerCard}
                                onClick={() => onSelect(player)}
                            >
                                <div>#{player.jerseyNumber}</div>
                                <div>{player.name}</div>
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