import React, {useEffect, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {TeamService} from "../OOP/services/TeamService";
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {ITeam} from "../OOP/interfaces/ITeam";
import {GameType} from "../OOP/enums/GameType";
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "../firebase";

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

    const updateTeamRoster = (teamId: string, newRoster: any[]) => {
        setTeams(prev =>
            prev.map(team =>
                team.id === teamId ? {...team, roster: newRoster} : team
            )
        );
    };

    const addToRoster = (teamId: string, player: any) => {
        updateTeamRoster(
            teamId,
            [...(teams.find(t => t.id === teamId)?.roster || []), player]
        );
    };

    const removeFromRoster = (teamId: string, playerId: string) => {
        updateTeamRoster(
            teamId,
            (teams.find(t => t.id === teamId)?.roster || []).filter(p => p.id !== playerId)
        );
    };

    const submitHandler = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        // Validate team selection
        if (!homeTeamId) newErrors.homeTeamId = "Home team must be selected";
        if (!awayTeamId) newErrors.awayTeamId = "Away team must be selected";
        if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) newErrors.sameTeams = "Home and away teams cannot be the same";

        // Validate colors (not same within team)
        if (homeColors.primary.toLowerCase() === homeColors.secondary.toLowerCase()) newErrors.homeColors = "Home team's primary and secondary colors cannot be the same";
        if (awayColors.primary.toLowerCase() === awayColors.secondary.toLowerCase()) newErrors.awayColors = "Away team's primary and secondary colors cannot be the same";
        // Validate colors (not same across teams)
        if (homeColors.primary.toLowerCase() === awayColors.primary.toLowerCase() && homeColors.secondary.toLowerCase() === awayColors.secondary.toLowerCase()) newErrors.sameColors = "Home and away team colors cannot be identical";

        // Validate rosters
        if (getSelectedPlayers(homeTeamId).length < 1) newErrors.homeRoster = "Home team must have at least one player in the roster";
        if (getSelectedPlayers(awayTeamId).length < 1) newErrors.awayRoster = "Away team must have at least one player in the roster";

        // Validate rink image
        if (!selectedImage) newErrors.rinkImage = "You must select a rink image";

        // If there are errors, set them and return
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const homeTeamData = teams.filter(t => t.id === homeTeamId)[0] as ITeam
        const awayTeamData = teams.filter(t => t.id === awayTeamId)[0] as ITeam
        const homeTeam = {...homeTeamData, roster: getSelectedPlayers(homeTeamData.id)} as ITeam
        const awayTeam = {...awayTeamData, roster: getSelectedPlayers(awayTeamData.id)} as ITeam

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

    useEffect(() => {
        const checkForSavedGame = () => {
            const savedGame = localStorage.getItem('unfinishedGame');
            console.log(JSON.parse(savedGame as string))
            if (savedGame) {
                if (window.confirm('An unfinished game was found. Do you want to continue?')) {
                    navigate('/game', {state: JSON.parse(savedGame as string)});
                } else {
                    localStorage.removeItem('unfinishedGame');
                }
            }
        };

        checkForSavedGame();
    }, [navigate]);

    return (
        <form onSubmit={submitHandler}>
            <label>
                Season:
                <select value={season} onChange={e => setSeason(e.target.value as Season)}>
                    {Object.values(Season).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </label>

            <label>
                Championship:
                <select
                    value={championship}
                    onChange={e => setChampionship(e.target.value as Championship)}
                >
                    {Object.values(Championship).map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                    ))}
                </select>
            </label>

            <label>
                Home team:
                <select
                    value={homeTeamId}
                    onChange={e => setHomeTeamId(e.target.value)}
                >
                    {teams.filter(t => t.championships.includes(championship))
                        .map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                </select>
            </label>
            {errors.homeTeamId && <span>{errors.homeTeamId}</span>}

            <label>
                Away team:
                <select
                    value={awayTeamId}
                    onChange={e => setAwayTeamId(e.target.value)}
                >
                    {teams.filter(t => t.championships.includes(championship))
                        .map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                </select>
            </label>
            {errors.awayTeamId && <span>{errors.awayTeamId}</span>}
            {errors.sameTeams && <span>{errors.sameTeams}</span>}

            <label>
                Game type:
                <select
                    value={gameType}
                    onChange={e => setGameType(e.target.value as GameType)}
                >
                    {Object.values(GameType).map((gt) => (
                        <option key={gt} value={gt}>{gt}</option>
                    ))}
                </select>
            </label>

            {/* Colors */}
            <label>
                Home Primary color
                <input
                    type="color"
                    value={homeColors.primary}
                    onChange={e => setHomeColors(prev => ({...prev, primary: e.target.value}))}
                />
            </label>

            <label>
                Home Secondary color
                <input
                    type="color"
                    value={homeColors.secondary}
                    onChange={e => setHomeColors(prev => ({...prev, secondary: e.target.value}))}
                />
            </label>
            {errors.homeColors && <span>{errors.homeColors}</span>}

            <label>
                Away Primary color
                <input
                    type="color"
                    value={awayColors.primary}
                    onChange={e => setAwayColors(prev => ({...prev, primary: e.target.value}))}
                />
            </label>

            <label>
                Away Secondary color
                <input
                    type="color"
                    value={awayColors.secondary}
                    onChange={e => setAwayColors(prev => ({...prev, secondary: e.target.value}))}
                />
            </label>
            {errors.awayColors && <span>{errors.awayColors}</span>}
            {errors.sameColors && <span>{errors.sameColors}</span>}

            <button type="button" onClick={() => setShowRosters(!showRosters)}>
                {showRosters ? 'Hide Rosters' : 'Show Rosters'}
            </button>

            {showRosters && (
                <>
                    {/* HOME */}
                    <h3>Home Roster</h3>
                    <h4>Available Players</h4>
                    {getAvailablePlayers(homeTeamId).map(player => (
                        <div key={player.id} onClick={() => addToRoster(homeTeamId, player)}>
                            {player.name}
                        </div>
                    ))}
                    <h4>Selected Players</h4>
                    {getSelectedPlayers(homeTeamId).map(player => (
                        <div key={player.id} onClick={() => removeFromRoster(homeTeamId, player.id)}>
                            {player.name}
                        </div>
                    ))}

                    {/* AWAY */}
                    <h3>Away Roster</h3>
                    <h4>Available Players</h4>
                    {getAvailablePlayers(awayTeamId).map(player => (
                        <div key={player.id} onClick={() => addToRoster(awayTeamId, player)}>
                            {player.name}
                        </div>
                    ))}
                    <h4>Selected Players</h4>
                    {getSelectedPlayers(awayTeamId).map(player => (
                        <div key={player.id} onClick={() => removeFromRoster(awayTeamId, player.id)}>
                            {player.name}
                        </div>
                    ))}
                </>
            )}
            {errors.homeRoster && <span>{errors.homeRoster}</span>}
            {errors.awayRoster && <span>{errors.awayRoster}</span>}

            {/* Rink Images */}
            <h3>Rink Image</h3>

            <label>
                <input
                    type="radio"
                    name="rinkImage"
                    value={rinkImages.rinkUp}
                    checked={selectedImage === rinkImages.rinkUp}
                    onChange={(e) => setSelectedImage(e.target.value)}
                />
                Up
                <img src={rinkImages.rinkUp || undefined} alt="Up"/>
            </label>

            <label>
                <input
                    type="radio"
                    name="rinkImage"
                    value={rinkImages.rinkDown}
                    checked={selectedImage === rinkImages.rinkDown}
                    onChange={(e) => setSelectedImage(e.target.value)}
                />
                Down
                <img src={rinkImages.rinkDown || undefined} alt="Down"/>
            </label>
            {errors.rinkImage && <span>{errors.rinkImage}</span>}

            <button type="submit">Start Game</button>
            <button type="button" onClick={() => navigate('/')}>
                Go Back
            </button>
        </form>
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
    return {teams, rinkDown, rinkUp}
};