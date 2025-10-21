import React, {useEffect, useRef, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {TeamService} from "../OOP/services/TeamService";
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {ITeam} from "../OOP/interfaces/ITeam";
import {GameType} from "../OOP/enums/GameType";
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "../firebase";
import Button from "../components/Button";
import Select from "../components/Select";
import Input from "../components/Input";
import styles from "./StartPage.module.css"

const StartPage = () => {
    const loaderData = useLoaderData();
    const teamsFromLoader = loaderData.teams as ITeam[]
    const [teams, setTeams] = useState<ITeam[]>(teamsFromLoader.map(t => ({...t, roster: t.roster || []})));
    const rinkImages = {rinkUp: loaderData.rinkUp, rinkDown: loaderData.rinkDown};

    const [season, setSeason] = useState<Season>(Season.SEASON_2025_2026);
    const [championship, setChampionship] = useState<Championship>(Championship.ERSTE_LEAGUE);
    const [gameType, setGameType] = useState<GameType>(GameType.REGULAR);
    const [homeTeamId, setHomeTeamId] = useState<string>(teams.filter(t => t.championships.includes(championship))[0]?.id || '');
    const [awayTeamId, setAwayTeamId] = useState<string>(teams.filter(t => t.championships.includes(championship))[1]?.id || '');
    const [homeColors, setHomeColors] = useState({primary: "#000000", secondary: "#ffffff"});
    const [awayColors, setAwayColors] = useState({primary: "#ffffff", secondary: "#000000"});
    const [selectedImage, setSelectedImage] = useState(rinkImages.rinkUp);
    const [showRosters, setShowRosters] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    // Helper function to count players by position
    const getPositionCounts = (roster: any[]) => {
        return {
            forwards: roster.filter(p => p.position === 'Forward').length,
            defenders: roster.filter(p => p.position === 'Defender').length,
            goalies: roster.filter(p => p.position === 'Goalie').length
        };
    };

    const updateTeamRoster = (teamId: string, newRoster: any[]) => {
        setTeams(prev =>
            prev.map(team =>
                team.id === teamId ? {...team, roster: newRoster} : team
            )
        );
    };

    const addToRoster = (teamId: string, player: any) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        const currentRoster = team.roster || [];
        const positionCounts = getPositionCounts(currentRoster);

        // Check roster constraints before adding
        if (player.position === 'Goalie' && positionCounts.goalies >= 2) {
            setErrors(prev => ({...prev, [`${teamId}Roster`]: 'Maximum 2 goalies allowed'}));
            return;
        }
        if (player.position === 'Defender' && positionCounts.defenders >= 6) {
            setErrors(prev => ({...prev, [`${teamId}Roster`]: 'Maximum 6 defenders allowed'}));
            return;
        }
        if (player.position === 'Forward' && positionCounts.forwards >= 12) {
            setErrors(prev => ({...prev, [`${teamId}Roster`]: 'Maximum 12 forwards allowed'}));
            return;
        }

        // Clear any previous roster errors for this team
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[`${teamId}Roster`];
            return newErrors;
        });

        updateTeamRoster(teamId, [...currentRoster, player]);
    };

    const removeFromRoster = (teamId: string, playerId: string) => {
        const currentRoster = teams.find(t => t.id === teamId)?.roster || [];

        // Clear any previous roster errors for this team
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[`${teamId}Roster`];
            return newErrors;
        });

        updateTeamRoster(
            teamId,
            currentRoster.filter(p => p.id !== playerId)
        );
    };

    const submitHandler = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        // Validate team selection
        if (!homeTeamId) newErrors.homeTeamId = "Home team must be selected";
        if (!awayTeamId) newErrors.awayTeamId = "Away team must be selected";
        if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) newErrors.sameTeams = "Home and away teams cannot be the same";

        // Validate colors (different within a team)
        if (homeColors.primary.toLowerCase() === homeColors.secondary.toLowerCase()) newErrors.homeColors = "Home team's primary and secondary colors cannot be the same";
        if (awayColors.primary.toLowerCase() === awayColors.secondary.toLowerCase()) newErrors.awayColors = "Away team's primary and secondary colors cannot be the same";
        // Validate colors (different across teams)
        if (homeColors.primary.toLowerCase() === awayColors.primary.toLowerCase() && homeColors.secondary.toLowerCase() === awayColors.secondary.toLowerCase()) newErrors.sameColors = "Home and away team colors cannot be identical";

        // Validate rosters with position constraints
        const homeRoster = getSelectedPlayers(homeTeamId);
        const awayRoster = getSelectedPlayers(awayTeamId);

        const homeCounts = getPositionCounts(homeRoster);
        const awayCounts = getPositionCounts(awayRoster);

        if (homeRoster.length < 1) newErrors.homeRoster = "Home team must have at least one player in the roster";
        if (awayRoster.length < 1) newErrors.awayRoster = "Away team must have at least one player in the roster";

        // Check minimum requirements
        // if (homeCounts.goalies !== 2) newErrors.homeRoster = "Home team must have 2 goalies";
        // if (homeCounts.defenders + homeCounts.forwards < 15) newErrors.homeRoster = "Home team must have at least 15 skaters";
        // if (homeCounts.defenders + homeCounts.forwards > 20) newErrors.homeRoster = "Home team must have at most 20 skaters";

        // if (awayCounts.goalies !== 2) newErrors.awayRoster = "Away team must have 2 goalies";
        // if (awayCounts.defenders + awayCounts.forwards < 15) newErrors.awayRoster = "Away team must have at least 15 skaters";
        // if (awayCounts.defenders + awayCounts.forwards > 20) newErrors.awayRoster = "Away team must have at most 20 skaters";

        // Validate rink image
        if (!selectedImage) newErrors.rinkImage = "You must select a rink image";

        // If there are errors, set them and return
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const homeTeamData = teams.filter(t => t.id === homeTeamId)[0] as ITeam
        const awayTeamData = teams.filter(t => t.id === awayTeamId)[0] as ITeam
        const homeTeam = {...homeTeamData, roster: homeRoster} as ITeam
        const awayTeam = {...awayTeamData, roster: awayRoster} as ITeam

        const setup = {
            season,
            championship,
            gameType,
            homeTeam,
            awayTeam,
            homeColors,
            awayColors,
            rinkImage: selectedImage,
        }

        console.log("Starting game with:", setup);

        navigate('/game', {state: setup});
    };

    const getAvailablePlayers = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return [];
        return team.players.filter(
            player => !(team.roster || []).some(rp => rp.id === player.id)
        );
    };

    const getSelectedPlayers = (teamId: string) => {
        return teams.find(t => t.id === teamId)?.roster || [];
    };

    const hasCheckedForSavedGame = useRef(false);

    useEffect(() => {
        if (hasCheckedForSavedGame.current) return;

        const checkForSavedGame = () => {
            const savedGame = localStorage.getItem('unfinishedGame');
            console.log(JSON.parse(savedGame as string))
            if (savedGame) {
                if (window.confirm('An unfinished game was found. Do you want to continue?')) {
                    hasCheckedForSavedGame.current = true;
                    navigate('/game', {state: JSON.parse(savedGame as string)});
                } else {
                    localStorage.removeItem('unfinishedGame');
                    hasCheckedForSavedGame.current = true;
                }
            }
        };

        checkForSavedGame();
    }, [navigate]);

    // Render position counters for a team
    // const renderPositionCounters = (teamId: string) => {
    //     const roster = getSelectedPlayers(teamId);
    //     const counts = getPositionCounts(roster);
    //
    //     return (
    //         <div className={styles.positionCounters}>
    //             <div className={styles.counterItem}>
    //                 <span>Forwards: {counts.forwards}/6-12</span>
    //             </div>
    //             <div className={styles.counterItem}>
    //                 <span>Defenders: {counts.defenders}/4-6</span>
    //             </div>
    //             <div className={styles.counterItem}>
    //                 <span>Goalies: {counts.goalies}/1-2</span>
    //             </div>
    //         </div>
    //     );
    // };

    return (
        <div className={styles.container}>
            <form onSubmit={submitHandler}>
                <div className={styles.formGrid}>
                    <Select
                        label="Season:"
                        value={season}
                        onChange={e => setSeason(e.target.value as Season)}
                        options={Object.values(Season).map(s => ({
                            value: s,
                            label: s
                        }))}
                    />

                    <Select
                        label="Championship:"
                        value={championship}
                        onChange={e => setChampionship(e.target.value as Championship)}
                        options={Object.values(Championship).map(ch => ({
                            value: ch,
                            label: ch
                        }))}
                    />

                    <Select
                        label="Home team:"
                        value={homeTeamId}
                        onChange={e => setHomeTeamId(e.target.value)}
                        options={teams.filter(t => t.championships.includes(championship))
                            .map(team => ({
                                value: team.id,
                                label: team.name
                            }))
                        }
                        error={errors.homeTeamId}
                    />

                    <Select
                        label="Away team:"
                        value={awayTeamId}
                        onChange={e => setAwayTeamId(e.target.value)}
                        options={teams.filter(t => t.championships.includes(championship))
                            .map(team => ({
                                value: team.id,
                                label: team.name
                            }))
                        }
                        error={errors.awayTeamId}
                    />
                    {errors.sameTeams && <span className={styles.error}>{errors.sameTeams}</span>}

                    <Select
                        label="Game type:"
                        value={gameType}
                        onChange={e => setGameType(e.target.value as GameType)}
                        options={Object.values(GameType).map(gt => ({
                            value: gt,
                            label: gt
                        }))}
                    />

                    <div className={styles.colorGroup}>
                        <Input
                            label="Home Primary color"
                            type="color"
                            value={homeColors.primary}
                            onChange={e => setHomeColors(prev => ({...prev, primary: e.target.value}))}
                        />

                        <Input
                            label="Home Secondary color"
                            type="color"
                            value={homeColors.secondary}
                            onChange={e => setHomeColors(prev => ({...prev, secondary: e.target.value}))}
                            error={errors.homeColors}
                        />
                    </div>

                    <div className={styles.colorGroup}>
                        <Input
                            label="Away Primary color"
                            type="color"
                            value={awayColors.primary}
                            onChange={e => setAwayColors(prev => ({...prev, primary: e.target.value}))}
                        />

                        <Input
                            label="Away Secondary color"
                            type="color"
                            value={awayColors.secondary}
                            onChange={e => setAwayColors(prev => ({...prev, secondary: e.target.value}))}
                            error={errors.awayColors}
                        />
                    </div>
                    {errors.sameColors && <span className={styles.error}>{errors.sameColors}</span>}
                </div>

                <div className={styles.rinkImages}>
                    <label
                        className={`${styles.rinkOption} ${selectedImage === rinkImages.rinkUp ? styles.selected : ''}`}>
                        <input
                            type="radio"
                            name="rinkImage"
                            value={rinkImages.rinkUp}
                            checked={selectedImage === rinkImages.rinkUp}
                            onChange={(e) => setSelectedImage(e.target.value)}
                            style={{display: 'none'}}
                        />
                        Up
                        <img src={rinkImages.rinkUp || undefined} alt="Up"/>
                    </label>

                    <label
                        className={`${styles.rinkOption} ${selectedImage === rinkImages.rinkDown ? styles.selected : ''}`}>
                        <input
                            type="radio"
                            name="rinkImage"
                            value={rinkImages.rinkDown}
                            checked={selectedImage === rinkImages.rinkDown}
                            onChange={(e) => setSelectedImage(e.target.value)}
                            style={{display: 'none'}}
                        />
                        Down
                        <img src={rinkImages.rinkDown || undefined} alt="Down"/>
                    </label>
                </div>
                {errors.rinkImage && <span className={styles.error}>{errors.rinkImage}</span>}

                <Button
                    styleType={showRosters ? "negative" : "positive"}
                    type="button"
                    onClick={() => setShowRosters(!showRosters)}
                >
                    {showRosters ? 'Hide Rosters' : 'Show Rosters'}
                </Button>

                {showRosters && (
                    <div className={styles.rosterSection}>
                        <div className={styles.rosterHeader}>
                            <h3>Team Rosters</h3>
                        </div>
                        <div className={styles.rosterContent}>
                            <div>
                                <h4>Home Roster</h4>
                                {/*{renderPositionCounters(homeTeamId)}*/}
                                <h5>Available Players</h5>
                                {getAvailablePlayers(homeTeamId).map(player => (
                                    <div
                                        key={player.id}
                                        className={styles.playerItem}
                                        onClick={() => addToRoster(homeTeamId, player)}
                                    >
                                        <div className={`${styles.playerStatus} ${styles.available}`}>+</div>
                                        #{player.jerseyNumber} - {player.name} ({player.position})
                                    </div>
                                ))}
                                <h5>Selected Players</h5>
                                {getSelectedPlayers(homeTeamId).map(player => (
                                    <div
                                        key={player.id}
                                        className={styles.playerItem}
                                        onClick={() => removeFromRoster(homeTeamId, player.id)}
                                    >
                                        <div className={`${styles.playerStatus} ${styles.selected}`}>×</div>
                                        #{player.jerseyNumber} - {player.name} ({player.position})
                                    </div>
                                ))}
                                {errors.homeRoster && <span className={styles.error}>{errors.homeRoster}</span>}
                            </div>

                            <div>
                                <h4>Away Roster</h4>
                                {/*{renderPositionCounters(awayTeamId)}*/}
                                <h5>Available Players</h5>
                                {getAvailablePlayers(awayTeamId).map(player => (
                                    <div
                                        key={player.id}
                                        className={styles.playerItem}
                                        onClick={() => addToRoster(awayTeamId, player)}
                                    >
                                        <div className={`${styles.playerStatus} ${styles.available}`}>+</div>
                                        #{player.jerseyNumber} - {player.name} ({player.position})
                                    </div>
                                ))}
                                <h5>Selected Players</h5>
                                {getSelectedPlayers(awayTeamId).map(player => (
                                    <div
                                        key={player.id}
                                        className={styles.playerItem}
                                        onClick={() => removeFromRoster(awayTeamId, player.id)}
                                    >
                                        <div className={`${styles.playerStatus} ${styles.selected}`}>×</div>
                                        #{player.jerseyNumber} - {player.name} ({player.position})
                                    </div>
                                ))}
                                {errors.awayRoster && <span className={styles.error}>{errors.awayRoster}</span>}
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.buttonGroup}>
                    <Button styleType={"positive"} type="submit">Start Game</Button>
                    <Button styleType={"negative"} type="button" onClick={() => navigate('/')}>Go Back</Button>
                </div>
            </form>
        </div>
    );
};

export default StartPage;

export const loader = async () => {
    const teamsData = await TeamService.getAllTeams() as ITeam[];
    const [rinkDown, rinkUp] = await Promise.all([
        getDownloadURL(ref(storage, "rink-images/icerink_down.jpg")),
        getDownloadURL(ref(storage, "rink-images/icerink_up.jpg")),
    ]);
    const teams = teamsData.filter(t => t.id !== "free-agent")
    return {teams, rinkDown, rinkUp};
}