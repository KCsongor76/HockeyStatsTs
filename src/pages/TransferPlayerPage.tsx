import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";
import {TeamService} from "../OOP/services/TeamService";
import {PlayerService} from "../OOP/services/PlayerService";
import Button from "../components/Button";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {ITeam} from "../OOP/interfaces/ITeam";

const TransferPlayerPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [player] = useState(() => {
        const p = location.state.player as IPlayer;
        return new Player(p.id, p.jerseyNumber, p.name, p.position, p.teamId);
    });

    const [currentTeam] = useState(() => {
        const t = location.state.team as ITeam;
        return t ? new Team(t) : null;
    });

    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const freeAgentHandler = async () => {
        if (window.confirm(`Are you sure you want to release ${player.name} to Free Agents?`)) {
            await executeTransfer("free-agent", true);
        }
    };

    const executeTransfer = async (targetTeamId: string, isRelease: boolean) => {
        setIsSubmitting(true);
        setErrors({});

        try {
            await PlayerService.transferPlayer(player.teamId, targetTeamId, player);
            alert(isRelease ? "Player released to Free Agents." : "Player transferred successfully.");
            navigate(`/${HANDLE_PLAYERS}`);
        } catch (error) {
            console.error("Transfer failed:", error);
            setErrors({general: "Transfer failed. Please try again."});
            setIsSubmitting(false);
        }
    };

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeamId) {
            setErrors({team: "Please select a team."});
            return;
        }

        const targetTeam = teams.find(t => t.id === selectedTeamId);

        if (!targetTeam) {
            setErrors({team: "Selected team is invalid."});
            return;
        }

        if (window.confirm(`Are you sure you want to transfer ${player.name} to ${targetTeam.name}?`)) {
            await executeTransfer(selectedTeamId, false);
        }
    };

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const allTeams = await TeamService.getAllTeams();
                // Filter out current team and the "Free Agent" team from the dropdown
                const validDestinations = allTeams.filter(t =>
                    t.id !== player.teamId &&
                    t.id !== "free-agent"
                );

                setTeams(validDestinations);

                // Auto-select first option
                if (validDestinations.length > 0) {
                    setSelectedTeamId(validDestinations[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch teams", error);
                setErrors({general: "Failed to load teams."});
            }
        };
        fetchTeams();
    }, [player.teamId]);

    return (
        <form onSubmit={submitHandler}>
            <h1>Transfer Player</h1>
            <p>Player: {player.name} (#{player.jerseyNumber})</p>
            <p>Current Team: {currentTeam?.name || "Free Agent"}</p>
            {player.teamId !== "free-agent" && (
                <div>
                    <label htmlFor="teamSelect">Transfer to:</label>
                    <select
                        id="teamSelect"
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {teams.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                    </select>
                    {errors.team && <span className="error">{errors.team}</span>}
                </div>
            )}

            {errors.jersey && <span>{errors.jersey}</span>}
            {errors.general && <span>{errors.general}</span>}


            {/* Only show "Set to Free Agent" if not already one */}
            {player.teamId !== "free-agent" && (
                <Button
                    styleType="neutral"
                    type="button"
                    onClick={freeAgentHandler}
                    disabled={isSubmitting}
                >
                    Release to Free Agent
                </Button>
            )}

            {/* Only show "Transfer" if there are teams to transfer to */}
            {teams.length > 0 && (
                <Button
                    styleType="positive"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {player.teamId === "free-agent" ? "Sign to Team" : "Transfer"}
                </Button>
            )}

            <Button
                styleType="negative"
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
            >
                Cancel
            </Button>
        </form>
    );
};

export default TransferPlayerPage;