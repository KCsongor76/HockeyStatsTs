import React from 'react';
import Button from "./Button";
import styles from "../pages/GamePage.module.css";

interface Props {
    availablePeriods: number[]
    selectedPeriods: number[]
    togglePeriod: (period: number) => void
}

const PeriodFilters = ({availablePeriods, selectedPeriods, togglePeriod}: Props) => {
    return <>
        {availablePeriods.length > 0 ? availablePeriods.map(period => (
            <Button
                styleType={"neutral"}
                key={period}
                type="button"
                className={selectedPeriods.includes(period) ? styles.active : ''}
                onClick={() => togglePeriod(period)}
            >
                {period}
            </Button>
        )) : <p>No available period data yet.</p>}
    </>
};

export default PeriodFilters;