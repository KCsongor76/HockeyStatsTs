import React from 'react';
import Button from "./Button";
import styles from "./PeriodFilters.module.css";
import { RegularPeriod, PlayoffPeriod } from "../OOP/enums/Period";
import { GameType } from "../OOP/enums/GameType";

interface Props {
    availablePeriods: number[]
    selectedPeriods: number[]
    togglePeriod: (period: number) => void
    gameType?: GameType // Add gameType prop
}

const PeriodFilters = ({ availablePeriods, selectedPeriods, togglePeriod, gameType }: Props) => {

    // Function to get period name from enum value
    const getPeriodName = (period: number): string => {
        if (gameType === GameType.PLAYOFF) {
            return PlayoffPeriod[period] || period.toString();
        } else {
            return RegularPeriod[period] || period.toString();
        }
    };

    return (
        <div className={styles.filterContainer}>
            {availablePeriods.length > 0 ? availablePeriods.map(period => (
                <Button
                    styleType={"neutral"}
                    key={period}
                    type="button"
                    className={selectedPeriods.includes(period) ? styles.activeButton : ''}
                    onClick={() => togglePeriod(period)}
                >
                    {getPeriodName(period)}
                </Button>
            )) : <p>No available period data yet.</p>}
        </div>
    );
};

export default PeriodFilters;