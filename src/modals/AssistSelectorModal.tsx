import React, {useState} from 'react';
import Button from '../components/Button';
import {IPlayer} from '../OOP/interfaces/IPlayer';
import {ITeam} from '../OOP/interfaces/ITeam';
import styles from './AssistSelectorModal.module.css';
import {PLACEHOLDER_PLAYER} from "../OOP/constants/PlaceholderPlayer";

interface Props {
    isOpen: boolean;
    team?: ITeam;
    excludedPlayer?: IPlayer;
    onClose: () => void;
    onSelect: (assists: IPlayer[]) => void;
    onGoBack: () => void;
}

const AssistSelectorModal = ({isOpen, team, excludedPlayer, onClose, onSelect, onGoBack}: Props) => {
    const [selectedAssists, setSelectedAssists] = useState<IPlayer[]>([]);
    if (!isOpen || !team) return null;

    // Add a placeholder player to the roster, exclude if it's the goalscorer
    const rosterWithPlaceholder = [PLACEHOLDER_PLAYER, ...team.roster].filter(
        player => player.id !== excludedPlayer?.id
    );

    const toggleAssist = (player: IPlayer) => {
        setSelectedAssists(prev => prev.includes(player) ? prev.filter(p => p.id !== player.id) : [...prev, player]);
    };

    const handleConfirm = () => {
        onSelect(selectedAssists);
        setSelectedAssists([])
    };

    const handleGoBack = () => {
        setSelectedAssists([])
        onGoBack()
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>Select Assists ({team.name})</h3>
                <p>Select 0-2 players</p>
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
                                className={`${styles.playerCard} ${selectedAssists.includes(player) ? styles.selected : ''}`}
                                onClick={() => toggleAssist(player)}
                            >
                                <div>#{player.jerseyNumber}</div>
                                <div>{player.name}</div>
                            </div>
                        ))}
                </div>
                <div className={styles.modalActions}>
                    <Button styleType="negative" onClick={handleGoBack}>
                        Go Back
                    </Button>
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