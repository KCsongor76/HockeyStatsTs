import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Player} from "../OOP/classes/Player";
import {Team} from "../OOP/classes/Team";
import {TeamService} from "../OOP/services/TeamService";
import {PlayerService} from "../OOP/services/PlayerService";
import Button from "../components/Button";
import Select from "../components/Select";
import Input from "../components/Input";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {ITeam} from "../OOP/interfaces/ITeam";
import styles from "./TransferPlayerPage.module.css";

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
    const [jerseyNumber, setJerseyNumber] = useState<number>(player.jerseyNumber);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const freeAgentHandler = async () => {
        if (window.confirm(`Are you sure you want to release ${player.name} to Free Agents?`)) {
            await executeTransfer("free-agent", true);
        }
    };

    const executeTransfer = async (targetTeamId: string, isRelease: boolean, playerToTransfer: IPlayer = player) => {
        setIsSubmitting(true);
        setErrors({});

        try {
            await PlayerService.transferPlayer(player.teamId, targetTeamId, playerToTransfer);
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
        setErrors({});

        if (!selectedTeamId) {
            setErrors({team: "Please select a team."});
            return;
        }

        const jerseyError = Player.validateJerseyNumber(jerseyNumber);
        if (jerseyError) {
            setErrors({jersey: jerseyError});
            return;
        }

        const isAvailable = await PlayerService.isJerseyNumberAvailable(selectedTeamId, jerseyNumber);
        if (!isAvailable) {
            setErrors({jersey: `Jersey number ${jerseyNumber} is already taken in the target team.`});
            return;
        }

        const targetTeam = teams.find(t => t.id === selectedTeamId);

        if (!targetTeam) {
            setErrors({team: "Selected team is invalid."});
            return;
        }

        if (window.confirm(`Are you sure you want to transfer ${player.name} to ${targetTeam.name}?`)) {
            const updatedPlayer = {...player, jerseyNumber: Number(jerseyNumber)};
            await executeTransfer(selectedTeamId, false, updatedPlayer);
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

    const teamOptions = teams.map(t => ({value: t.id, label: t.name}));

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <h1 className={styles.title}>Transfer Player</h1>
                <div className={styles.infoSection}>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Player</span>
                        <span className={styles.value}>{player.name} (#{player.jerseyNumber})</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.label}>Current Team</span>
                        <span className={styles.value}>{currentTeam?.name || "Free Agent"}</span>
                    </div>
                </div>

                <form onSubmit={submitHandler} className={styles.form}>

                    <Select
                        id="teamSelect"
                        label="Transfer to:"
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        disabled={isSubmitting}
                        options={teamOptions}
                        error={errors.team}
                    />

                    <Input
                        id="jerseyNumber"
                        label="Jersey Number"
                        type="number"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(Number(e.target.value))}
                        disabled={isSubmitting}
                        error={errors.jersey}
                    />

            {errors.general && <span className={styles.error}>{errors.general}</span>}

            <div className={styles.buttonGroup}>
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
            </div>
        </form>
            </div>
        </div>
    );
};

export default TransferPlayerPage;