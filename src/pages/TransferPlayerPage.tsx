import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import {PlayerService} from "../OOP/services/PlayerService";
import Button from "../components/Button";
import Select from "../components/Select";
import styles from "./TransferPlayerPage.module.css"
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";

const TransferPlayerPage = () => {
    const location = useLocation();
    const player = location.state.player as IPlayer;
    const team = location.state.team as ITeam;
    const [teams, setTeams] = useState<ITeam[]>([]);
    const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const freeAgentHandler = async () => {
        if (window.confirm(`Set ${player.name} as free agent?`)) {
            try {
                await PlayerService.transferPlayer(player.teamId, selectedTeamId, player);
                alert("Player is now a free agent");
                navigate(`/${HANDLE_PLAYERS}`);
            } catch (error) {
                setErrors({general: 'Failed to set as free agent.'});
            }
        }
    };

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeamId) {
            setErrors({team: 'Select a team'});
            return;
        }

        const newTeam = teams.find(t => t.id === selectedTeamId)!;
        try {
            const isAvailable = await PlayerService.isJerseyNumberAvailable(newTeam.id, player.jerseyNumber);
            if (!isAvailable) {
                setErrors({jersey: `Jersey number ${player.jerseyNumber} is taken!`});
                return;
            }

            if (window.confirm(`Transfer ${player.name} to ${newTeam.name}?`)) {
                await PlayerService.transferPlayer(player.teamId, selectedTeamId, player);
                alert("Transfer successful.");
                navigate(`/${HANDLE_PLAYERS}`);
            }
        } catch (error) {
            setErrors({general: 'Transfer failed. Please try again.'});
        }
    };

    useEffect(() => {
        if (player.teamId === 'free-agent') {
            setIsFreeAgent(true);
        }
        TeamService.getAllTeams().then(teamsData => setTeams(teamsData));
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Transfer Player</h1>
            </div>

            <div className={styles.playerInfo}>
                <p>Player: {player.name}</p>
                <p>Current Team: {team.name}</p>
            </div>

            <form onSubmit={submitHandler} className={styles.form}>
                <Select
                    label="Transfer to:"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    options={teams.filter(t => t.id !== team.id && t.id !== "free-agent")
                        .map(t => ({
                            value: t.id,
                            label: t.name
                        }))
                    }
                    error={errors.team}
                />

                {errors.jersey && <span className={styles.error}>{errors.jersey}</span>}
                {errors.general && <span className={styles.error}>{errors.general}</span>}

                <div className={styles.buttonGroup}>
                    {!isFreeAgent && (
                        <Button
                            styleType={"neutral"}
                            type="button"
                            onClick={freeAgentHandler}
                        >
                            Set to free agent
                        </Button>
                    )}
                    <Button
                        styleType={"positive"}
                        type="submit"
                    >
                        Transfer
                    </Button>
                    <Button
                        styleType={"negative"}
                        type="button"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default TransferPlayerPage;