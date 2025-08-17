import React from 'react';
import Button from "./Button";
import styles from "../pages/GamePage.module.css";

interface Props {
    teamView: "all" | "home" | "away";
    setTeamView: (value: React.SetStateAction<"all" | "home" | "away">) => void
}

const TeamFilters = ({teamView, setTeamView}: Props) => {
    return (
        <>
            <Button
                styleType={"neutral"}
                type="button"
                className={teamView === 'all' ? styles.active : ''}
                onClick={() => setTeamView('all')}
            >
                All Teams
            </Button>
            <Button
                styleType={"neutral"}
                type="button"
                className={teamView === 'home' ? styles.active : ''}
                onClick={() => setTeamView('home')}
            >
                Home Team
            </Button>
            <Button
                styleType={"neutral"}
                type="button"
                className={teamView === 'away' ? styles.active : ''}
                onClick={() => setTeamView('away')}
            >
                Away Team
            </Button>
        </>
    );
};

export default TeamFilters;