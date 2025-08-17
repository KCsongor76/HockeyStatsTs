import React, {useState} from 'react';
import {Position} from "../OOP/enums/Position";
import {useLocation, useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {PlayerService} from "../OOP/services/PlayerService";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import styles from "./CreatePlayerPage.module.css";

const CreatePlayerPage = () => {
    const location = useLocation()
    const teams = location.state.teams as ITeam[];
    const [playerData, setPlayerData] = useState({
        name: '',
        position: Position.GOALIE,
        jerseyNumber: 1,
        teamId: teams[0].id,
    });
    const [isFreeAgent, setIsFreeAgent] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const trimmedName = playerData.name.trim();

        if (!trimmedName) {
            newErrors.name = 'Name is required';
        }

        if (isNaN(playerData.jerseyNumber)) {
            newErrors.jerseyNumber = 'Jersey number must be a number';
        } else if (playerData.jerseyNumber < 1 || playerData.jerseyNumber > 99) {
            newErrors.jerseyNumber = 'Jersey number must be between 1-99';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submitHandler = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;
        if (isFreeAgent) playerData.teamId = "free-agent";
        console.log(playerData)

        try {
            const isJerseyNumberAvailable = await PlayerService.isJerseyNumberAvailable(playerData.teamId, playerData.jerseyNumber)
            if (!isFreeAgent && !isJerseyNumberAvailable) {
                setErrors(prev => ({
                    ...prev,
                    jerseyNumber: `Jersey number ${playerData.jerseyNumber} is already taken`
                }));
                return;
            }
            const player = {...playerData, id: ""} as IPlayer;
            console.log(player)
            await PlayerService.createPlayer(player.teamId, player);
            alert('Player created successfully!');
            navigate("/handlePlayers")
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                general: 'Failed to create player. Please try again.'
            }));
            console.error('Failed to create player:', error);
        }
    }

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>Create New Player</h1>
            <form onSubmit={submitHandler}>
                <Input
                    label="Name:"
                    type="text"
                    value={playerData.name}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, name: e.target.value}))
                        setErrors(prev => ({...prev, name: ''}))
                    }}
                    required
                    error={errors.name}
                />

                <Input
                    label="Jersey number:"
                    type="number"
                    value={playerData.jerseyNumber}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, jerseyNumber: Number(e.target.value)}))
                        setErrors(prev => ({...prev, jerseyNumber: ''}))
                    }}
                    required
                    min={1}
                    max={99}
                    error={errors.jerseyNumber}
                />

                <Select
                    label="Position:"
                    value={playerData.position}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, position: e.target.value as Position}))
                    }}
                    options={Object.values(Position).map(position => ({
                        value: position,
                        label: position
                    }))}
                />

                <Input
                    label="Free Agent"
                    type="checkbox"
                    checked={isFreeAgent}
                    onChange={() => setIsFreeAgent(!isFreeAgent)}
                />

                {!isFreeAgent && (
                    <Select
                        label="Team:"
                        value={playerData.teamId}
                        onChange={(e) => {
                            setPlayerData(prev => ({...prev, teamId: e.target.value}))
                        }}
                        options={teams
                            .filter(team => team.id !== "free-agent")
                            .map(team => ({
                                value: team.id,
                                label: team.name
                            }))
                        }
                    />
                )}

                {errors.general && <span style={{color: 'red'}}>{errors.general}</span>}

                <div className={styles.buttonGroup}>
                    <Button styleType={"positive"} type="submit">Create player</Button>
                    <Button styleType={"negative"} type="button" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlayerPage;