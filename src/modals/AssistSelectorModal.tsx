import React, {useState} from 'react';
import Button from '../components/Button';
import {IPlayer} from '../OOP/interfaces/IPlayer';
import {ITeam} from '../OOP/interfaces/ITeam';
import styles from './AssistSelectorModal.module.css';

interface Props {
    isOpen: boolean;
    team?: ITeam;
    excludedPlayer?: IPlayer;
    onClose: () => void;
    onSelect: (assists: IPlayer[]) => void;
    onGoBack?: () => void;
}

const AssistSelectorModal = ({isOpen, team, excludedPlayer, onClose, onSelect, onGoBack}: Props) => {
    const [selectedAssists, setSelectedAssists] = useState<IPlayer[]>([]);
    if (!isOpen || !team) return null;

    const toggleAssist = (player: IPlayer) => {
        setSelectedAssists(prev => prev.includes(player) ? prev.filter(p => p.id !== player.id) : [...prev, player]);
    };

    const handleConfirm = () => {
        onSelect(selectedAssists);
        setSelectedAssists([])
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>Select Assists ({team.name})</h3>
                <p>Select 0-2 players</p>
                <div className={styles.rosterGrid}>
                    {team.roster
                        .filter(player => player.id !== excludedPlayer?.id)
                        .map(player => (
                            <div
                                key={player.id}
                                className={`${styles.playerCard} ${selectedAssists.includes(player) ? styles.selected : ''}`}
                                onClick={() => toggleAssist(player)}
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
                    <Button
                        styleType="positive"
                        onClick={handleConfirm}
                        disabled={selectedAssists.length > 2}
                    >
                        Confirm ({selectedAssists.length}/2)
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AssistSelectorModal;