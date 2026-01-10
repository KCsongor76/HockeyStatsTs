import React, {useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Player} from "../OOP/classes/Player";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {PlayerService} from "../OOP/services/PlayerService";
import PlayerForm, {PlayerFormData} from "../components/forms/PlayerForm";
import styles from "./EditPlayerPage.module.css";

const EditPlayerPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [player] = useState<Player>(() => {
        const p = location.state.player as IPlayer;
        return new Player(p.id, p.jerseyNumber, p.name, p.position, p.teamId);
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSave = async (data: PlayerFormData) => {
        if (data.name === player.name && data.position === player.position && data.jerseyNumber === player.jerseyNumber) {
            navigate(-1);
            return;
        }

        if (data.jerseyNumber !== player.jerseyNumber) {
            const err = Player.validateJerseyNumber(data.jerseyNumber);
            if (err) {
                setErrors(prev => ({...prev, jerseyNumber: err}));
                return;
            }
        }

        try {
            await PlayerService.updatePlayer(player.teamId, player.id, {
                name: data.name,
                position: data.position,
                jerseyNumber: data.jerseyNumber
            });
            navigate(-1);
        } catch (error) {
            console.error("Failed to update player:", error);
            setErrors(prev => ({...prev, general: 'Failed to update player.'}));
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>Edit {player.name}</h1>
                {errors.general && <div className={styles.errorContainer}>{errors.general}</div>}
                <PlayerForm
                    initialData={player}
                    onSubmit={handleSave}
                    onCancel={() => navigate(-1)}
                    submitLabel="Save Changes"
                    errors={errors}
                    setErrors={setErrors}
                />
            </div>
        </div>
    );
};

export default EditPlayerPage;