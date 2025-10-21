import React from 'react';
import {ActionType} from '../OOP/enums/ActionType';
import styles from './ConfirmationModal.module.css';
import Button from "../components/Button";

interface Props {
    isOpen: boolean;
    action: {
        type?: ActionType;
        team?: { name: string };
        player?: { name: string, jerseyNumber: number };
        assists?: { name: string, jerseyNumber: number }[];
        period?: number;
        time?: number;
    };
    position?: { x: number, y: number } | null;
    onClose: () => void;
    onConfirm: () => void;
    onGoBack?: () => void;
}

const ConfirmationModal = ({isOpen, action, position, onClose, onConfirm, onGoBack}: Props) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>Confirm Action</h3>

                <div className={styles.detailRow}>
                    <span>Action Type:</span>
                    <span>{action.type}</span>
                </div>

                <div className={styles.detailRow}>
                    <span>Team:</span>
                    <span>{action.team?.name}</span>
                </div>

                <div className={styles.detailRow}>
                    <span>Player:</span>
                    <span>#{action.player?.jerseyNumber} {action.player?.name}</span>
                </div>

                {action.assists && action.assists.length > 0 && (
                    <div className={styles.detailRow}>
                        <span>Assists:</span>
                        <span>
                            {action.assists.map(a => `#${a.jerseyNumber} ${a.name}`).join(', ')}
                        </span>
                    </div>
                )}

                <div className={styles.detailRow}>
                    <span>Position:</span>
                    <span>X: {position?.x.toFixed(1)}%, Y: {position?.y.toFixed(1)}%</span>
                </div>

                {action.period && (
                    <div className={styles.detailRow}>
                        <span>Period:</span>
                        <span>{action.period}</span>
                    </div>
                )}

                {action.time != null && (
                    <div className={styles.detailRow}>
                        <span>Time:</span>
                        <span>{Math.floor(action.time / 60).toString().padStart(2, '0')} : {(action.time % 60).toString().padStart(2, '0')}</span>
                    </div>
                )}

                <div className={styles.modalActions}>
                    {onGoBack && (
                        <Button styleType="negative" onClick={onGoBack}>
                            Go Back
                        </Button>
                    )}
                    <Button styleType="negative" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button styleType="positive" onClick={onConfirm}>
                        Confirm
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;