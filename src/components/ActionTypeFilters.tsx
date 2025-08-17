import React from 'react';
import Button from "./Button";
import styles from "./ActionTypeFilters.module.css";
import {ActionType} from "../OOP/enums/ActionType";


interface Props {
    availableActionTypes: ActionType[]
    selectedActionTypes: ActionType[]
    toggleActionType: (period: ActionType) => void
}

const ActionTypeFilters = ({availableActionTypes, selectedActionTypes, toggleActionType}: Props) => {
    return (
        <div className={styles.filterContainer}>
            {availableActionTypes.length > 0 ? availableActionTypes.map(period => (
                <Button
                    styleType={"neutral"}
                    key={period}
                    type="button"
                    className={selectedActionTypes.includes(period) ? styles.activeButton : ''}
                    onClick={() => toggleActionType(period)}
                >
                    {period}
                </Button>
            )) : <p>No available period data yet.</p>}
        </div>
    );
};

export default ActionTypeFilters;