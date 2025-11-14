import React, {useState, useEffect} from 'react';
import {ActionType} from "../OOP/enums/ActionType";
import {ITeam} from "../OOP/interfaces/ITeam";
import {GameType} from "../OOP/enums/GameType";
import {RegularPeriod, PlayoffPeriod} from "../OOP/enums/Period";
import styles from "./ActionSelectorModal.module.css";
import Button from "../components/Button";
import ExampleIcon from "../components/ExampleIcon";

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

    // Get available periods based on game type
    const getPeriods = () => {
        if (gameType === GameType.REGULAR) {
            return Object.entries(RegularPeriod)
                .filter(([key, value]) => typeof value === 'number')
                .map(([key, value]) => ({
                    value: value as number,
                    label: key
                }));
        } else {
            return Object.entries(PlayoffPeriod)
                .filter(([key, value]) => typeof value === 'number')
                .map(([key, value]) => ({
                    value: value as number,
                    label: key
                }));
        }
    };

    // Get time constraints based on Period
    const getTimeConstraints = (period: number) => {
        if (gameType === GameType.REGULAR) {
            switch (period) {
                case RegularPeriod.FIRST:
                case RegularPeriod.SECOND:
                case RegularPeriod.THIRD:
                    return { maxMinutes: 19, maxSeconds: 59 };
                case RegularPeriod.OT:
                    return { maxMinutes: 4, maxSeconds: 59 };
                case RegularPeriod.SO:
                    return { maxMinutes: 0, maxSeconds: 0 };
                default:
                    return { maxMinutes: 19, maxSeconds: 59 };
            }
        } else {
            switch (period) {
                case PlayoffPeriod.FIRST:
                case PlayoffPeriod.SECOND:
                case PlayoffPeriod.THIRD:
                    return { maxMinutes: 19, maxSeconds: 59 };
                default: // All overtime periods
                    return { maxMinutes: 19, maxSeconds: 59 };
            }
        }
    };

    const periods = getPeriods();
    const timeConstraints = getTimeConstraints(period);

    // Reset time when period changes
    useEffect(() => {
        setMinutes(0);
        setSeconds(0);
    }, [period]);

    if (!isOpen) return null;

    const handleActionSelect = (type: ActionType, team: ITeam) => {
        const timeInSeconds = minutes * 60 + seconds;
        onSelect(type, team, period, timeInSeconds);
    };

    const handleMinutesChange = (value: number) => {
        if (value >= 0 && value <= timeConstraints.maxMinutes) {
            setMinutes(value);
        }
    };

    const handleSecondsChange = (value: number) => {
        if (value >= 0 && value <= timeConstraints.maxSeconds) {
            setSeconds(value);
        }
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
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.timeInput}>
                        <label>Time:</label>
                        <input
                            type="number"
                            min="0"
                            max={timeConstraints.maxMinutes}
                            value={minutes}
                            onChange={(e) => handleMinutesChange(Number(e.target.value))}
                            disabled={timeConstraints.maxMinutes === 0}
                        />
                        <span>:</span>
                        <input
                            type="number"
                            min="0"
                            max={timeConstraints.maxSeconds}
                            value={seconds.toString().padStart(2, '0')}
                            onChange={(e) => handleSecondsChange(Number(e.target.value))}
                            disabled={timeConstraints.maxSeconds === 0}
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
                                    <ExampleIcon
                                        actionType={type}
                                        backgroundColor={homeColors.primary}
                                        color={homeColors.secondary}
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
                                    <ExampleIcon
                                        actionType={type}
                                        backgroundColor={awayColors.primary}
                                        color={awayColors.secondary}
                                    />
                                    <span>{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <Button styleType="negative" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ActionSelectorModal;