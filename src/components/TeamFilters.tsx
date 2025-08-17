import React from 'react';
import Button from "./Button";
import styles from "./TeamFilters.module.css";

interface Props {
    teamView: "all" | "home" | "away";
    setTeamView: (value: React.SetStateAction<"all" | "home" | "away">) => void
}

const TeamFilters = ({teamView, setTeamView}: Props) => {
    return (
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
};

export default TeamFilters;