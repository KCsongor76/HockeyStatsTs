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
import ExampleIcon from "../components/ExampleIcon";
import {ActionType} from "../OOP/enums/ActionType";
import {GAME} from "../OOP/constants/NavigationNames";

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

    // Helper function to get team by ID
    const getTeamById = (id: string): ITeam | undefined => {
        return teams.find(t => t.id === id);
    };

    // Update colors when teams change
    useEffect(() => {
        if (homeTeamId) {
            const homeTeam = getTeamById(homeTeamId);
            if (homeTeam) {
                setHomeColors({
                    primary: homeTeam.homeColor.primary,
                    secondary: homeTeam.homeColor.secondary
                });
            }
        }
    }, [homeTeamId]);

    useEffect(() => {
        if (awayTeamId) {
            const awayTeam = getTeamById(awayTeamId);
            if (awayTeam) {
                setAwayColors({
                    primary: awayTeam.awayColor.primary,
                    secondary: awayTeam.awayColor.secondary
                });
            }
        }
    }, [awayTeamId]);

    // Update teams when championship changes
    useEffect(() => {
        const championshipTeams = teams.filter(t => t.championships.includes(championship));

        // Update the home team if the current selection is not in the new championship
        if (homeTeamId && !championshipTeams.some(t => t.id === homeTeamId)) {
            setHomeTeamId(championshipTeams[0]?.id || '');
        }

        // Update away team if current selection is not in the new championship
        if (awayTeamId && !championshipTeams.some(t => t.id === awayTeamId)) {
            setAwayTeamId(championshipTeams[1]?.id || '');
        }
    }, [championship, teams, homeTeamId, awayTeamId]);

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
        updateTeamRoster(teamId, [...currentRoster, player]);
    };

    const removeFromRoster = (teamId: string, playerId: string) => {
        const currentRoster = teams.find(t => t.id === teamId)?.roster || [];

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

        const minSkatersLength = 15
        let maxSkatersLength
        if (championship === Championship.ERSTE_LEAGUE) {
            maxSkatersLength = 19
        } else {
            maxSkatersLength = 20
        }

        if (homeCounts.goalies !== 2) newErrors.homeRoster = "Home team must have exactly 2 goalies!"
        if (awayCounts.goalies !== 2) newErrors.awayRoster = "Away team must have exactly 2 goalies!"

        if (homeCounts.defenders + homeCounts.forwards < minSkatersLength) newErrors.homeRoster = `Home team must have at least ${minSkatersLength} skaters in the roster`;
        if (awayCounts.defenders + awayCounts.forwards < minSkatersLength) newErrors.awayRoster = `Away team must have at least ${minSkatersLength} skaters in the roster`;

        if (homeCounts.defenders + homeCounts.forwards > maxSkatersLength) newErrors.homeRoster = `Home team must have at most ${maxSkatersLength} skaters in the roster`;
        if (awayCounts.defenders + awayCounts.forwards > maxSkatersLength) newErrors.awayRoster = `Away team must have at most ${maxSkatersLength} skaters in the roster`;

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

        navigate(`/${GAME}`, {state: setup});
    };

    const getAvailablePlayers = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return [];
        return team.players
            .filter(player => !(team.roster || []).some(rp => rp.id === player.id))
            .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
    };

    const getSelectedPlayers = (teamId: string) => {
        return teams
                .find(t => t.id === teamId)?.roster
                .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
            || [];
    };

    const hasCheckedForSavedGame = useRef(false);

    useEffect(() => {
        if (hasCheckedForSavedGame.current) return;

        const checkForSavedGame = () => {
            const savedGame = localStorage.getItem('unfinishedGame');
            if (savedGame) {
                if (window.confirm('An unfinished game was found. Do you want to continue?')) {
                    hasCheckedForSavedGame.current = true;
                    navigate(`/${GAME}`, {state: JSON.parse(savedGame as string)});
                } else {
                    localStorage.removeItem('unfinishedGame');
                    hasCheckedForSavedGame.current = true;
                }
            }
        };

        checkForSavedGame();
    }, [navigate]);

    return (
        <div>
            <form onSubmit={submitHandler}>
                <div>
                    <div>
                        <label htmlFor="season">Season:</label>
                        <select
                            id="season"
                            value={season}
                            onChange={e => setSeason(e.target.value as Season)}
                        >
                            {Object.values(Season).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="championship">Championship:</label>
                        <select
                            id="championship"
                            value={championship}
                            onChange={e => setChampionship(e.target.value as Championship)}
                        >
                            {Object.values(Championship).map(ch => (
                                <option key={ch} value={ch}>{ch}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="homeTeam">Home team:</label>
                        <select
                            id="homeTeam"
                            value={homeTeamId}
                            onChange={e => setHomeTeamId(e.target.value)}
                        >
                            {teams.filter(t => t.championships.includes(championship)).map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                        {errors.homeTeamId && <span>{errors.homeTeamId}</span>}
                    </div>

                    <div>
                        <label htmlFor="awayTeam">Away team:</label>
                        <select
                            id="awayTeam"
                            value={awayTeamId}
                            onChange={e => setAwayTeamId(e.target.value)}
                        >
                            {teams.filter(t => t.championships.includes(championship)).map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                        {errors.awayTeamId && <span>{errors.awayTeamId}</span>}
                    </div>
                    {errors.sameTeams && <span>{errors.sameTeams}</span>}

                    <div>
                        <label htmlFor="gameType">Game type:</label>
                        <select
                            id="gameType"
                            value={gameType}
                            onChange={e => setGameType(e.target.value as GameType)}
                        >
                            {Object.values(GameType).map(gt => (
                                <option key={gt} value={gt}>{gt}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div>
                            <label htmlFor="homePrimary">Home Primary color</label>
                            <input
                                id="homePrimary"
                                type="color"
                                value={homeColors.primary}
                                onChange={e => setHomeColors(prev => ({...prev, primary: e.target.value}))}
                            />
                        </div>

                        <div>
                            <label htmlFor="homeSecondary">Home Secondary color</label>
                            <input
                                id="homeSecondary"
                                type="color"
                                value={homeColors.secondary}
                                onChange={e => setHomeColors(prev => ({...prev, secondary: e.target.value}))}
                            />
                            {errors.homeColors && <span>{errors.homeColors}</span>}
                        </div>

                        <ExampleIcon
                            actionType={ActionType.GOAL}
                            backgroundColor={homeColors.primary}
                            color={homeColors.secondary}
                        />
                    </div>

                    <div>
                        <div>
                            <label htmlFor="awayPrimary">Away Primary color</label>
                            <input
                                id="awayPrimary"
                                type="color"
                                value={awayColors.primary}
                                onChange={e => setAwayColors(prev => ({...prev, primary: e.target.value}))}
                            />
                        </div>

                        <div>
                            <label htmlFor="awaySecondary">Away Secondary color</label>
                            <input
                                id="awaySecondary"
                                type="color"
                                value={awayColors.secondary}
                                onChange={e => setAwayColors(prev => ({...prev, secondary: e.target.value}))}
                            />
                            {errors.awayColors && <span>{errors.awayColors}</span>}
                        </div>

                        <ExampleIcon
                            actionType={ActionType.GOAL}
                            backgroundColor={awayColors.primary}
                            color={awayColors.secondary}
                        />
                    </div>
                    {errors.sameColors && <span>{errors.sameColors}</span>}
                </div>

                <div>
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
                </div>
                {errors.rinkImage && <span>{errors.rinkImage}</span>}

                <Button
                    styleType={showRosters ? "negative" : "positive"}
                    type="button"
                    onClick={() => setShowRosters(!showRosters)}
                >
                    {showRosters ? 'Hide Rosters' : 'Show Rosters'}
                </Button>

                {showRosters && (
                    <div>
                        <div>
                            <h3>Team Rosters</h3>
                        </div>
                        <div>
                            {/* Home Team Roster */}
                            <div>
                                <h4>Home Roster</h4>

                                {/* Available Players */}
                                <h5>Available Players</h5>
                                <div>
                                    <h6>Goalies</h6>
                                    {getAvailablePlayers(homeTeamId)
                                        .filter(player => player.position === 'Goalie')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => addToRoster(homeTeamId, player)}
                                            >
                                                <div>+</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Defenders</h6>
                                    {getAvailablePlayers(homeTeamId)
                                        .filter(player => player.position === 'Defender')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => addToRoster(homeTeamId, player)}
                                            >
                                                <div>+</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Forwards</h6>
                                    {getAvailablePlayers(homeTeamId)
                                        .filter(player => player.position === 'Forward')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => addToRoster(homeTeamId, player)}
                                            >
                                                <div>+</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>

                                {/* Selected Players */}
                                <h5>Selected Players</h5>
                                <div>
                                    <h6>Goalies</h6>
                                    {getSelectedPlayers(homeTeamId)
                                        .filter(player => player.position === 'Goalie')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => removeFromRoster(homeTeamId, player.id)}
                                            >
                                                <div>×</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Defenders</h6>
                                    {getSelectedPlayers(homeTeamId)
                                        .filter(player => player.position === 'Defender')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => removeFromRoster(homeTeamId, player.id)}
                                            >
                                                <div>×</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Forwards</h6>
                                    {getSelectedPlayers(homeTeamId)
                                        .filter(player => player.position === 'Forward')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => removeFromRoster(homeTeamId, player.id)}
                                            >
                                                <div>×</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>

                                {/* Home Team Roster Summary */}
                                <div>
                                    {(() => {
                                        const homeRoster = getSelectedPlayers(homeTeamId);
                                        const counts = getPositionCounts(homeRoster);
                                        const minSkaters = 15;
                                        const maxSkaters = championship === Championship.ERSTE_LEAGUE ? 19 : 20;
                                        const totalSkaters = counts.defenders + counts.forwards;

                                        return (
                                            <>
                                                <div>Goalies: {counts.goalies}/2</div>
                                                <div>Skaters: {totalSkaters}/{minSkaters}-{maxSkaters}</div>
                                                {errors.homeRoster &&
                                                    <span>{errors.homeRoster}</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Away Team Roster */}
                            <div>
                                <h4>Away Roster</h4>

                                {/* Available Players */}
                                <h5>Available Players</h5>
                                <div>
                                    <h6>Goalies</h6>
                                    {getAvailablePlayers(awayTeamId)
                                        .filter(player => player.position === 'Goalie')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => addToRoster(awayTeamId, player)}
                                            >
                                                <div>+</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Defenders</h6>
                                    {getAvailablePlayers(awayTeamId)
                                        .filter(player => player.position === 'Defender')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => addToRoster(awayTeamId, player)}
                                            >
                                                <div>+</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Forwards</h6>
                                    {getAvailablePlayers(awayTeamId)
                                        .filter(player => player.position === 'Forward')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => addToRoster(awayTeamId, player)}
                                            >
                                                <div>+</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>

                                {/* Selected Players */}
                                <h5>Selected Players</h5>
                                <div>
                                    <h6>Goalies</h6>
                                    {getSelectedPlayers(awayTeamId)
                                        .filter(player => player.position === 'Goalie')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => removeFromRoster(awayTeamId, player.id)}
                                            >
                                                <div>×</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Defenders</h6>
                                    {getSelectedPlayers(awayTeamId)
                                        .filter(player => player.position === 'Defender')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => removeFromRoster(awayTeamId, player.id)}
                                            >
                                                <div>×</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>
                                <div>
                                    <h6>Forwards</h6>
                                    {getSelectedPlayers(awayTeamId)
                                        .filter(player => player.position === 'Forward')
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => removeFromRoster(awayTeamId, player.id)}
                                            >
                                                <div>×</div>
                                                #{player.jerseyNumber} - {player.name}
                                            </div>
                                        ))}
                                </div>

                                {/* Away Team Roster Summary */}
                                <div>
                                    {(() => {
                                        const awayRoster = getSelectedPlayers(awayTeamId);
                                        const counts = getPositionCounts(awayRoster);
                                        const minSkaters = 15;
                                        const maxSkaters = championship === Championship.ERSTE_LEAGUE ? 19 : 20;
                                        const totalSkaters = counts.defenders + counts.forwards;

                                        return (
                                            <>
                                                <div>Goalies: {counts.goalies}/2</div>
                                                <div>Skaters: {totalSkaters}/{minSkaters}-{maxSkaters}</div>
                                                {errors.awayRoster &&
                                                    <span>{errors.awayRoster}</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {(errors.homeRoster || errors.awayRoster) &&
                    <span>Some roster related error has occurred.</span>}

                <div>
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