import React from 'react';
import Button from "../Button";
import styles from "./GameFilters.module.css";
import {ActionType} from "../../OOP/enums/ActionType";
import {GameType} from "../../OOP/enums/GameType";
import {GameUtils} from "../../utils/GameUtils";

// Team Filter
interface TeamFilterProps {
    teamView: 'all' | 'home' | 'away';
    setTeamView: (view: 'all' | 'home' | 'away') => void;
}

export const TeamFilter: React.FC<TeamFilterProps> = ({teamView, setTeamView}) => (
    <div className={styles.filterContainer}>
        <Button
            styleType={"neutral"}
            type="button"
            className={teamView === 'all' ? styles.activeButton : ''}
            onClick={() => setTeamView('all')}
        >
            All Teams
        </Button>
        <Button
            styleType={"neutral"}
            type="button"
            className={teamView === 'home' ? styles.activeButton : ''}
            onClick={() => setTeamView('home')}
        >
            Home Team
        </Button>
        <Button
            styleType={"neutral"}
            type="button"
            className={teamView === 'away' ? styles.activeButton : ''}
            onClick={() => setTeamView('away')}
        >
            Away Team
        </Button>
    </div>
);

// Color Selector
interface ColorSelectorProps {
    useDefaultHome: boolean;
    setUseDefaultHome: (val: boolean) => void;
    useDefaultAway: boolean;
    setUseDefaultAway: (val: boolean) => void;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
                                                                useDefaultHome,
                                                                setUseDefaultHome,
                                                                useDefaultAway,
                                                                setUseDefaultAway
                                                            }) => (
    <div className={styles.controlsContainer}>
        <Button
            styleType={useDefaultHome ? 'positive' : 'neutral'}
            onClick={() => setUseDefaultHome(!useDefaultHome)}
        >
            {useDefaultHome ? 'Home-currently: Default Colors' : 'Home-currently: Game Colors'}
        </Button>

        <Button
            styleType={useDefaultAway ? 'positive' : 'neutral'}
            onClick={() => setUseDefaultAway(!useDefaultAway)}
        >
            {useDefaultAway ? 'Away-currently: Default Colors' : 'Away-currently: Game Colors'}
        </Button>
    </div>
);

// Period Filter
interface PeriodFilterProps {
    availablePeriods: number[];
    selectedPeriods: number[];
    togglePeriod: (period: number) => void;
    gameType: GameType;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
                                                              availablePeriods,
                                                              selectedPeriods,
                                                              togglePeriod,
                                                              gameType
                                                          }) => (
    <div className={styles.filterContainer}>
        {availablePeriods.length > 0 ? availablePeriods.map(period => (
            <Button
                styleType={"neutral"}
                key={period}
                type="button"
                className={selectedPeriods.includes(period) ? styles.activeButton : ''}
                onClick={() => togglePeriod(period)}
            >
                {GameUtils.getPeriodFilterLabel(period, gameType)}
            </Button>
        )) : <p>No available period data yet.</p>}
    </div>
);

// Action Type Filter
interface ActionTypeFilterProps {
    availableActionTypes: ActionType[];
    selectedActionTypes: ActionType[];
    toggleActionType: (type: ActionType) => void;
}

export const ActionTypeFilter: React.FC<ActionTypeFilterProps> = ({
                                                                      availableActionTypes,
                                                                      selectedActionTypes,
                                                                      toggleActionType
                                                                  }) => (
    <div className={styles.filterContainer}>
        {availableActionTypes.length > 0 ? availableActionTypes.map(type => (
            <Button
                styleType={"neutral"}
                key={type}
                type="button"
                className={selectedActionTypes.includes(type) ? styles.activeButton : ''}
                onClick={() => toggleActionType(type)}
            >
                {type}
            </Button>
        )) : <p>No available action type data yet.</p>}
    </div>
);