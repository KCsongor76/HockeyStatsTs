import React from 'react';
import Button from "./Button";
import styles from "../pages/GamePage.module.css";
import {ActionType} from "../OOP/enums/ActionType";

interface Props {
    availableActionTypes: ActionType[]
    selectedActionTypes: ActionType[]
    toggleActionType: (period: ActionType) => void
}

const ActionTypeFilters = ({availableActionTypes, selectedActionTypes, toggleActionType}: Props) => {
    return <>
        {availableActionTypes.length > 0 ? availableActionTypes.map(period => (
            <Button
                styleType={"neutral"}
                key={period}
                type="button"
                className={selectedActionTypes.includes(period) ? styles.active : ''}
                onClick={() => toggleActionType(period)}
            >
                {period}
            </Button>
        )) : <p>No available period data yet.</p>}
    </>
};

export default ActionTypeFilters;