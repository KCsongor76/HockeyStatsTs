import React, {useState} from 'react';
import {Position} from "../OOP/enums/Position";
import {useLocation, useNavigate} from "react-router-dom";
import {ITeam} from "../OOP/interfaces/ITeam";
import {PlayerService} from "../OOP/services/PlayerService";
import {IPlayer} from "../OOP/interfaces/IPlayer";

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
        <form onSubmit={submitHandler}>
            <label>
                Name:
                <input
                    type="text"
                    value={playerData.name}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, name: e.target.value}))
                        setErrors(prev => ({...prev, name: ''}))
                    }}
                    required
                />
            </label>
            {errors.name && <span>{errors.name}</span>}

            <label>
                Jersey number:
                <input
                    type="number"
                    value={playerData.jerseyNumber}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, jerseyNumber: Number(e.target.value)}))
                        setErrors(prev => ({...prev, jerseyNumber: ''}))
                    }}
                    required
                    min={1}
                    max={99}
                />
            </label>
            {errors.jerseyNumber && <span>{errors.jerseyNumber}</span>}

            <label>
                Position:
                <select
                    value={playerData.position}
                    onChange={(e) => {
                        setPlayerData(prev => ({...prev, position: e.target.value as Position}))
                    }}
                >
                    {Object.values(Position).map((position) => (
                        <option key={position} value={position}>{position}</option>
                    ))}
                </select>
            </label>

            <label>
                Free Agent
                <input
                    type="checkbox"
                    checked={isFreeAgent}
                    onChange={() => setIsFreeAgent(!isFreeAgent)}
                />
            </label>

            {!isFreeAgent && (
                <label>
                    Team:
                    <select
                        value={playerData.teamId}
                        onChange={(e) => {
                            setPlayerData(prev => ({...prev, teamId: e.target.value}))
                        }}
                    >
                        {teams
                            .filter(team => team.id !== "free-agent")
                            .map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                    </select>
                </label>
            )}
            {errors.general && <span>{errors.general}</span>}

            <button type="submit">Create player</button>
            <button type="button" onClick={() => navigate(-1)}>Go Back</button>
        </form>
    );
};

export default CreatePlayerPage;