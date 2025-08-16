import React, {useState} from 'react';
import {ActionType} from "../OOP/enums/ActionType";
import Icon from "../components/Icon";
import {ITeam} from "../OOP/interfaces/ITeam";
import {GameType} from "../OOP/enums/GameType";
import {RegularPeriod, PlayoffPeriod} from "../OOP/enums/Period";
import styles from "./ActionSelectorModal.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (actionType: ActionType, team: ITeam, period: number, time: number) => void;
    homeTeam: ITeam;
    awayTeam: ITeam;
    homeColors: { primary: string; secondary: string };
    awayColors: { primary: string; secondary: string };
    gameType: GameType;
}

const ActionSelectorModal = ({
                                 isOpen,
                                 onClose,
                                 onSelect,
                                 homeTeam,
                                 awayTeam,
                                 homeColors,
                                 awayColors,
                                 gameType
                             }: Props) => {
    const [period, setPeriod] = useState<number>(1);
    const [minutes, setMinutes] = useState<number>(0);
    const [seconds, setSeconds] = useState<number>(0);

    if (!isOpen) return null;

    const periods = gameType === GameType.REGULAR
        ? Object.values(RegularPeriod).filter(v => typeof v === 'number') as number[]
        : Object.values(PlayoffPeriod).filter(v => typeof v === 'number') as number[];

    const handleActionSelect = (type: ActionType, team: ITeam) => {
        const timeInSeconds = minutes * 60 + seconds;
        onSelect(type, team, period, timeInSeconds);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2>Select Action</h2>

                <div className={styles.timeSelector}>
                    <div className={styles.periodSelector}>
                        <label>Period:</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(Number(e.target.value))}
                        >
                            {periods.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.timeInput}>
                        <label>Time:</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={minutes}
                            onChange={(e) => setMinutes(Number(e.target.value))}
                        />
                        <span>:</span>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={seconds.toString().padStart(2, '0')}
                            onChange={(e) => setSeconds(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className={styles.actionsGrid}>
                    {/* Home Team Actions */}
                    <div className={styles.teamSection}>
                        <h3>{homeTeam.name}</h3>
                        <div className={styles.actionsRow}>
                            {[ActionType.GOAL, ActionType.SHOT, ActionType.TURNOVER, ActionType.HIT].map(type => (
                                <div
                                    key={`home-${type}`}
                                    className={styles.actionItem}
                                    onClick={() => handleActionSelect(type, homeTeam)}
                                >
                                    <Icon
                                        actionType={type}
                                        backgroundColor={homeColors.primary}
                                        color={homeColors.secondary}
                                        x={50}
                                        y={50}
                                    />
                                    <span>{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Away Team Actions */}
                    <div className={styles.teamSection}>
                        <h3>{awayTeam.name}</h3>
                        <div className={styles.actionsRow}>
                            {[ActionType.GOAL, ActionType.SHOT, ActionType.TURNOVER, ActionType.HIT].map(type => (
                                <div
                                    key={`away-${type}`}
                                    className={styles.actionItem}
                                    onClick={() => handleActionSelect(type, awayTeam)}
                                >
                                    <Icon
                                        actionType={type}
                                        backgroundColor={awayColors.primary}
                                        color={awayColors.secondary}
                                        x={50}
                                        y={50}
                                    />
                                    <span>{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ActionSelectorModal;