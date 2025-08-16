import React from 'react';
import {IGameAction} from "../OOP/interfaces/IGameAction";
import {ActionType} from "../OOP/enums/ActionType";
import styles from "./ActionDetailsModal.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    action: IGameAction | null;
}

const ActionDetailsModal: React.FC<Props> = ({isOpen, onClose, action}) => {
    if (!isOpen || !action) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2>Action Details</h2>

                <div className={styles.detailRow}>
                    <strong>Type:</strong>
                    <span>{action.type}</span>
                </div>

                <div className={styles.detailRow}>
                    <strong>Team:</strong>
                    <span>{action.team.name}</span>
                </div>

                <div className={styles.detailRow}>
                    <strong>Player:</strong>
                    <span>{action.player.name} (#{action.player.jerseyNumber})</span>
                </div>

                {action.type === ActionType.GOAL && action.assists && action.assists.length > 0 && (
                    <div className={styles.detailRow}>
                        <strong>Assists:</strong>
                        <div>
                            {action.assists.map((assist, index) => (
                                <div key={index}>
                                    {assist.name} (#{assist.jerseyNumber})
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.detailRow}>
                    <strong>Period:</strong>
                    <span>{action.period}</span>
                </div>

                <div className={styles.detailRow}>
                    <strong>Time:</strong>
                    <span>{action.time}</span>
                </div>

                <div className={styles.detailRow}>
                    <strong>Location:</strong>
                    <span>X: {action.x.toFixed(1)}%, Y: {action.y.toFixed(1)}%</span>
                </div>

                <button className={styles.closeButton} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default ActionDetailsModal;