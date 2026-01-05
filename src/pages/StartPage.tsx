import React, {useEffect, useRef, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {TeamService} from "../OOP/services/TeamService";
import {Season} from "../OOP/enums/Season";
import {Championship, CHAMPIONSHIP_RULES} from "../OOP/enums/Championship";
import {Team} from "../OOP/classes/Team";
import {GameType} from "../OOP/enums/GameType";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "../firebase";
import Button from "../components/Button";
import ExampleIcon from "../components/ExampleIcon";
import {ActionType} from "../OOP/enums/ActionType";
import {GAME} from "../OOP/constants/NavigationNames";
import {TeamRosterSelector} from "../components/TeamRosterSelector";
import {GameSetupValidator} from "../OOP/classes/GameSetupValidator";

const StartPage = () => {
    const loaderData = useLoaderData() as { teams: Team[], rinkDown: string, rinkUp: string };
    const rinkImages = {rinkUp: loaderData.rinkUp, rinkDown: loaderData.rinkDown};

    const [gameType, setGameType] = useState<GameType>(GameType.REGULAR);

    const [teams, setTeams] = useState<Team[]>(loaderData.teams);
    const defaultTeams = teams.filter(t => t.championships.includes(championship));

    const [season, setSeason] = useState<Season>(Season.SEASON_2025_2026);
    const [championship, setChampionship] = useState<Championship>(Championship.ERSTE_LEAGUE);
    const [homeTeamId, setHomeTeamId] = useState<string>(defaultTeams[0]?.id || '');
    const [awayTeamId, setAwayTeamId] = useState<string>(defaultTeams[1]?.id || '');
    const [homeColors, setHomeColors] = useState({primary: "#000000", secondary: "#ffffff"});
    const [awayColors, setAwayColors] = useState({primary: "#ffffff", secondary: "#000000"});
    const [selectedImage, setSelectedImage] = useState(rinkImages.rinkUp);
    const [showRosters, setShowRosters] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const navigate = useNavigate();
    const hasCheckedForSavedGame = useRef(false);

    const getTeamById = (id: string): Team | undefined => teams.find(t => t.id === id);

    const updateTeamRoster = (teamId: string, newRoster: IPlayer[]) => {
        setTeams(prev => prev.map(team => {
            if (team.id === teamId) {
                return new Team({...team, roster: newRoster});
            }
            return team;
        }));
    };

    const submitHandler = (e: React.FormEvent) => {
        e.preventDefault();

        const homeTeam = getTeamById(homeTeamId);
        const awayTeam = getTeamById(awayTeamId);

        const setupErrors = GameSetupValidator.validateGameSetup({
            homeTeamId,
            awayTeamId,
            homeColors,
            awayColors,
            rinkImage: selectedImage
        });

        const rules = CHAMPIONSHIP_RULES[championship];
        const rosterErrors: Record<string, string> = {};

        if (homeTeam) {
            const err = homeTeam.validateRoster(rules);
            if (err) rosterErrors.homeRoster = `Home: ${err}`;
        }
        if (awayTeam) {
            const err = awayTeam.validateRoster(rules);
            if (err) rosterErrors.awayRoster = `Away: ${err}`;
        }

        const combinedErrors = {...setupErrors, ...rosterErrors};

        if (Object.keys(combinedErrors).length > 0) {
            setErrors(combinedErrors);
            return;
        }

        if (homeTeam && awayTeam) {
            navigate(`/${GAME}`, {
                state: {
                    season,
                    championship,
                    gameType,
                    homeTeam: homeTeam, // Pass the full object
                    awayTeam: awayTeam,
                    homeColors,
                    awayColors,
                    rinkImage: selectedImage,
                }
            });
        }
    };

    // Sync colors on team change
    useEffect(() => {
        const team = getTeamById(homeTeamId);
        if (team) setHomeColors({...team.homeColor});
    }, [homeTeamId]);

    useEffect(() => {
        const team = getTeamById(awayTeamId);
        if (team) setAwayColors({...team.awayColor});
    }, [awayTeamId]);

    // Update teams when championship changes
    useEffect(() => {
        const validTeams = teams.filter(t => t.championships.includes(championship));
        const isAvailable = (id: string) => validTeams.some(t => t.id === id);

        if (homeTeamId && !isAvailable(homeTeamId)) setHomeTeamId(validTeams[0]?.id || '');
        if (awayTeamId && !isAvailable(awayTeamId)) setAwayTeamId(validTeams[1]?.id || '');
    }, [championship]);

    // Check saved game
    useEffect(() => {
        if (hasCheckedForSavedGame.current) return;
        const savedGame = localStorage.getItem('unfinishedGame');
        if (savedGame) {
            if (window.confirm('An unfinished game was found. Do you want to continue?')) {
                navigate(`/${GAME}`, {state: JSON.parse(savedGame)});
            } else {
                localStorage.removeItem('unfinishedGame');
            }
            hasCheckedForSavedGame.current = true;
        }
    }, [navigate]);

    return (
        <form onSubmit={submitHandler}>
            <label htmlFor="season">Season:</label>
            <select id="season" value={season} onChange={e => setSeason(e.target.value as Season)}>
                {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label htmlFor="championship">Championship:</label>
            <select id="championship" value={championship}
                    onChange={e => setChampionship(e.target.value as Championship)}>
                {Object.values(Championship).map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>

            {/* Team Selectors */}
            <label htmlFor="homeTeam">Home team:</label>
            <select id="homeTeam" value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}>
                {teams.filter(t => t.championships.includes(championship)).map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                ))}
            </select>
            {errors.homeTeamId && <span className="error">{errors.homeTeamId}</span>}

            <label htmlFor="awayTeam">Away team:</label>
            <select id="awayTeam" value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}>
                {teams.filter(t => t.championships.includes(championship)).map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                ))}
            </select>
            {errors.awayTeamId && <span className="error">{errors.awayTeamId}</span>}
            {errors.sameTeams && <span className="error">{errors.sameTeams}</span>}

            <label htmlFor="gameType">Game type:</label>
            <select id="gameType" value={gameType} onChange={e => setGameType(e.target.value as GameType)}>
                {Object.values(GameType).map(gt => <option key={gt} value={gt}>{gt}</option>)}
            </select>

            {/* Colors Section */}
            <label htmlFor="homePrimary">Home Primary color</label>
            <input
                id="homePrimary"
                type="color"
                value={homeColors.primary}
                onChange={e => setHomeColors(p => ({...p, primary: e.target.value}))}
            />

            <label htmlFor="homeSecondary">Home Secondary color</label>
            <input
                id="homeSecondary"
                type="color"
                value={homeColors.secondary}
                onChange={e => setHomeColors(p => ({...p, secondary: e.target.value}))}
            />
            {errors.homeColors && <span className="error">{errors.homeColors}</span>}

            <ExampleIcon
                actionType={ActionType.GOAL}
                backgroundColor={homeColors.primary}
                color={homeColors.secondary}
            />

            <label htmlFor="awayPrimary">Away Primary color</label>
            <input
                id="awayPrimary"
                type="color"
                value={awayColors.primary}
                onChange={e => setAwayColors(p => ({...p, primary: e.target.value}))}
            />

            <label htmlFor="awaySecondary">Away Secondary color</label>
            <input
                id="awaySecondary"
                type="color"
                value={awayColors.secondary}
                onChange={e => setAwayColors(p => ({...p, secondary: e.target.value}))}
            />
            {errors.awayColors && <span className="error">{errors.awayColors}</span>}

            <ExampleIcon
                actionType={ActionType.GOAL}
                backgroundColor={awayColors.primary}
                color={awayColors.secondary}
            />

            {errors.sameColors && <span className="error">{errors.sameColors}</span>}

            {/* Rink Images */}
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
            {errors.rinkImage && <span className="error">{errors.rinkImage}</span>}

            {/* Roster Section */}
            <Button styleType={showRosters ? "negative" : "positive"} type="button"
                    onClick={() => setShowRosters(!showRosters)}>
                {showRosters ? 'Hide Rosters' : 'Show Rosters'}
            </Button>

            {showRosters && (
                <>
                    <TeamRosterSelector
                        teamName="Home Roster"
                        allPlayers={getTeamById(homeTeamId)?.players || []}
                        currentRoster={getTeamById(homeTeamId)?.roster || []}
                        onChange={(newRoster) => updateTeamRoster(homeTeamId, newRoster)}
                        rules={CHAMPIONSHIP_RULES[championship]}
                        error={errors.homeRoster}
                    />

                    <TeamRosterSelector
                        teamName="Away Roster"
                        allPlayers={getTeamById(awayTeamId)?.players || []}
                        currentRoster={getTeamById(awayTeamId)?.roster || []}
                        onChange={(newRoster) => updateTeamRoster(awayTeamId, newRoster)}
                        rules={CHAMPIONSHIP_RULES[championship]}
                        error={errors.awayRoster}
                    />
                </>
            )}

            {(errors.homeRoster || errors.awayRoster) &&
                <span className="error">Please check the rosters for errors.</span>}

            <Button styleType={"positive"} type="submit">Start Game</Button>
            <Button styleType={"negative"} type="button" onClick={() => navigate('/')}>Go Back</Button>
        </form>
    );
};

export default StartPage;

export const loader = async () => {
    const teamsData = await TeamService.getAllTeams();
    const [rinkDown, rinkUp] = await Promise.all([
        getDownloadURL(ref(storage, "rink-images/icerink_down.jpg")),
        getDownloadURL(ref(storage, "rink-images/icerink_up.jpg")),
    ]);
    const teams = teamsData.filter(t => t.id !== "free-agent");
    return {teams, rinkDown, rinkUp};
}