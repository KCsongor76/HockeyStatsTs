import React from 'react';
import Button from "../Button";
import styles from "./GameFilters.module.css";

interface GameControlsProps {
    onSaveLocally: () => void;
    autosave: boolean;
    onToggleAutosave: () => void;
    onFinalize: () => void;
    showDetails: boolean;
    onToggleDetails: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
                                                       onSaveLocally,
                                                       autosave,
                                                       onToggleAutosave,
                                                       onFinalize,
                                                       showDetails,
                                                       onToggleDetails
                                                   }) => {
    return (
        <div className={styles.container}>
            <Button styleType={"positive"} type="button" onClick={onSaveLocally}>
                Save Game Locally
            </Button>

            <Button
                styleType={autosave ? "positive" : "negative"}
                onClick={onToggleAutosave}
            >
                Autosave: {autosave ? "ON" : "OFF"}
            </Button>

            <Button styleType={"positive"} type="button" onClick={onFinalize}>
                Finalize Game
            </Button>

            <Button
                styleType={showDetails ? "negative" : "positive"}
                onClick={onToggleDetails}
            >
                {showDetails ? 'Hide Game Icons' : 'Show Game Icons'}
            </Button>
        </div>
    );
};

export default GameControls;