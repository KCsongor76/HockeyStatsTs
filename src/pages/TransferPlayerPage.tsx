import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import {PlayerService} from "../OOP/services/PlayerService";

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
                navigate('/handlePlayers');
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
                navigate('/handlePlayers');
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
        <div>
            <h1>Transfer Player</h1>
            <p>Player: {player.name}</p>
            <p>Current Team: {team.name}</p>
            <form onSubmit={submitHandler}>
                <label>
                    Transfer to:
                    <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        {teams.filter(t => t.id !== team.id && t.id !== "free-agent")
                            .map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                    </select>
                </label>

                {errors.team && <span>{errors.team}</span>}
                {errors.jersey && <span>{errors.jersey}</span>}
                {errors.general && <span>{errors.general}</span>}

                {!isFreeAgent && (
                    <button type="button" onClick={freeAgentHandler}>
                        Set to free agent
                    </button>
                )}
                <button type="submit">
                    Transfer
                </button>
                <button type="button" onClick={() => navigate(-1)}>
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default TransferPlayerPage;