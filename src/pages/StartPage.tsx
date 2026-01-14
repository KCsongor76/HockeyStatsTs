import React, {useEffect, useRef, useState} from 'react';
import {useLoaderData, useNavigate} from "react-router-dom";
import {TeamService} from "../OOP/services/TeamService";
import {Season} from "../OOP/enums/Season";
import {Championship, CHAMPIONSHIP_RULES} from "../OOP/enums/Championship";
import {Team} from "../OOP/classes/Team";
import {GameType} from "../OOP/enums/GameType";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import RadioButton from "../components/RadioButton";
import ExampleIcon from "../components/ExampleIcon";
import {ActionType} from "../OOP/enums/ActionType";
import {GAME} from "../OOP/constants/NavigationNames";
import {TeamRosterSelector} from "../components/TeamRosterSelector";
import {GameSetupValidator} from "../OOP/classes/GameSetupValidator";
import styles from "./StartPage.module.css";

const StartPage = () => {
    const loaderData = useLoaderData() as { teams: Team[], rinkDown: string, rinkUp: string };
    const rinkImages = {rinkUp: loaderData.rinkUp, rinkDown: loaderData.rinkDown};

    const [gameType, setGameType] = useState<GameType>(GameType.REGULAR);

    const [teams, setTeams] = useState<Team[]>(loaderData.teams);
    const [season, setSeason] = useState<Season>(Season.SEASON_2025_2026);
    const [championship, setChampionship] = useState<Championship>(Championship.ERSTE_LEAGUE);

    // Derived default teams based on championship
    const defaultTeams = teams.filter(t => t.championships.includes(championship));

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
    }, [championship, teams, homeTeamId, awayTeamId]);

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

    // Option Builders
    const seasonOptions = Object.values(Season).map(s => ({value: s, label: s}));
    const championshipOptions = Object.values(Championship).map(ch => ({value: ch, label: ch}));
    const gameTypeOptions = Object.values(GameType).map(gt => ({value: gt, label: gt}));

    const availableTeams = teams.filter(t => t.championships.includes(championship));
    const teamOptions = availableTeams.map(t => ({value: t.id, label: t.name}));

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Start New Game</h1>
            <form onSubmit={submitHandler} className={styles.form}>
                <div className={styles.section}>
                    <h3>Game Details</h3>
                    <div className={`${styles.row} ${styles.threeCols}`}>
                        <Select
                            id="season"
                            label="Season"
                            value={season}
                            onChange={e => setSeason(e.target.value as Season)}
                            options={seasonOptions}
                        />

                        <Select
                            id="championship"
                            label="Championship"
                            value={championship}
                            onChange={e => setChampionship(e.target.value as Championship)}
                            options={championshipOptions}
                        />

                        <Select
                            id="gameType"
                            label="Game Type"
                            value={gameType}
                            onChange={e => setGameType(e.target.value as GameType)}
                            options={gameTypeOptions}
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Teams</h3>
                    <div className={styles.row}>
                        <Select
                            id="homeTeam"
                            label="Home Team"
                            value={homeTeamId}
                            onChange={e => setHomeTeamId(e.target.value)}
                            options={teamOptions}
                            error={errors.homeTeamId}
                        />

                        <Select
                            id="awayTeam"
                            label="Away Team"
                            value={awayTeamId}
                            onChange={e => setAwayTeamId(e.target.value)}
                            options={teamOptions}
                            error={errors.awayTeamId || errors.sameTeams}
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Team Colors</h3>
                    <div className={styles.colorsContainer}>
                        <div className={styles.teamColorGroup}>
                            <h4>Home Colors</h4>
                            <div className={styles.colorInputs}>
                                <Input
                                    id="homePrimary"
                                    label="Primary"
                                    type="color"
                                    value={homeColors.primary}
                                    onChange={e => setHomeColors(p => ({...p, primary: e.target.value}))}
                                />
                                <Input
                                    id="homeSecondary"
                                    label="Secondary"
                                    type="color"
                                    value={homeColors.secondary}
                                    onChange={e => setHomeColors(p => ({...p, secondary: e.target.value}))}
                                    error={errors.homeColors}
                                />
                            </div>
                            <div className={styles.previewIcon}>
                                <ExampleIcon
                                    actionType={ActionType.GOAL}
                                    backgroundColor={homeColors.primary}
                                    color={homeColors.secondary}
                                />
                            </div>
                        </div>

                        <div className={styles.teamColorGroup}>
                            <h4>Away Colors</h4>
                            <div className={styles.colorInputs}>
                                <Input
                                    id="awayPrimary"
                                    label="Primary"
                                    type="color"
                                    value={awayColors.primary}
                                    onChange={e => setAwayColors(p => ({...p, primary: e.target.value}))}
                                />
                                <Input
                                    id="awaySecondary"
                                    label="Secondary"
                                    type="color"
                                    value={awayColors.secondary}
                                    onChange={e => setAwayColors(p => ({...p, secondary: e.target.value}))}
                                    error={errors.awayColors}
                                />
                            </div>
                            <div className={styles.previewIcon}>
                                <ExampleIcon
                                    actionType={ActionType.GOAL}
                                    backgroundColor={awayColors.primary}
                                    color={awayColors.secondary}
                                />
                            </div>
                        </div>
                    </div>
                    {errors.sameColors && <div className={styles.error}>{errors.sameColors}</div>}
                </div>

                <div className={styles.section}>
                    <h3>Rink Direction</h3>
                    <div className={styles.rinkImages}>
                        <div className={`${styles.rinkOption} ${selectedImage === rinkImages.rinkUp ? styles.rinkOptionSelected : ''}`}>
                            <RadioButton
                                id="rinkUp"
                                name="rinkImage"
                                value={rinkImages.rinkUp}
                                checked={selectedImage === rinkImages.rinkUp}
                                onChange={(e) => setSelectedImage(e.target.value)}
                                label={
                                    <>
                                        Up
                                        <img src={rinkImages.rinkUp || undefined} alt="Up"/>
                                    </>
                                }
                            />
                        </div>
                        <div className={`${styles.rinkOption} ${selectedImage === rinkImages.rinkDown ? styles.rinkOptionSelected : ''}`}>
                            <RadioButton
                                id="rinkDown"
                                name="rinkImage"
                                value={rinkImages.rinkDown}
                                checked={selectedImage === rinkImages.rinkDown}
                                onChange={(e) => setSelectedImage(e.target.value)}
                                label={
                                    <>
                                        Down
                                        <img src={rinkImages.rinkDown || undefined} alt="Down"/>
                                    </>
                                }
                            />
                        </div>
                    </div>
                    {errors.rinkImage && <div className={styles.error}>{errors.rinkImage}</div>}
                </div>

                <div className={styles.section}>
                    <div className={styles.rosterToggle}>
                        <Button styleType={showRosters ? "neutral" : "positive"} type="button"
                                onClick={() => setShowRosters(!showRosters)}>
                            {showRosters ? 'Hide Rosters' : 'Show/Edit Rosters'}
                        </Button>
                    </div>

                    {showRosters && (
                        <div className={styles.rosterContainer}>
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
                        </div>
                    )}

                    {(errors.homeRoster || errors.awayRoster) &&
                        <div className={styles.errorSummary}>Please check the rosters for errors.</div>}
                </div>

                <div className={styles.buttonGroup}>
                    <Button styleType={"neutral"} type="button" onClick={() => navigate('/')}>Go Back</Button>
                    <Button styleType={"positive"} type="submit">Start Game</Button>
                </div>
            </form>
        </div>
    );
};

export default StartPage;

export const loader = async () => {
    const teamsData = await TeamService.getAllTeams();
    // Using local public folder paths instead of fetching from storage
    const rinkDown = "/rink/icerink_down.jpg";
    const rinkUp = "/rink/icerink_up.jpg";
    const teams = teamsData.filter(t => t.id !== "free-agent");
    return {teams, rinkDown, rinkUp};
}