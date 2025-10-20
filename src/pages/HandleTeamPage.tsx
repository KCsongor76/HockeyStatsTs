import React, {useMemo, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {Championship} from "../OOP/enums/Championship";
import {GameType} from "../OOP/enums/GameType";
import {Season} from "../OOP/enums/Season";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {IGame} from "../OOP/interfaces/IGame";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import SavedGamesPage from "./SavedGamesPage";
import {Player} from "../OOP/classes/Player";
import TeamTable from "../components/TeamTable";
import PlayerTable from "../components/PlayerTable";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import styles from "./HandleTeamPage.module.css"

const HandleTeamPage = () => {
    const location = useLocation();
    const games = location.state.games as IGame[];
    const [team, setTeam] = useState(location.state.team as ITeam);
    const [name, setName] = useState(team.name);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<Season | 'All'>('All');
    const [selectedChampionship, setSelectedChampionship] = useState<Championship | 'All'>('All');
    const [showPlayers, setShowPlayers] = useState<boolean>(false);
    const [showGames, setShowGames] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const getFilteredGames = (type?: GameType) => {
        let result = games.filter(g => g.teams.home.id === team.id || g.teams.away.id === team.id);
        if (type) {
            result = result.filter(g => g.type === type);
        }
        if (selectedChampionship !== 'All') {
            result = result.filter(g => g.championship === selectedChampionship);
        }
        if (selectedSeason !== 'All') {
            result = result.filter(g => g.season === selectedSeason);
        }
        return result;
    };

    const filteredPlayers = useMemo(() => {
        const allPlayersInGames = new Map<string, IPlayer>();

        games.forEach(game => {
            if (game.teams.home.id === team.id && game.teams.home.roster) {
                game.teams.home.roster.forEach(player => {
                    if (!allPlayersInGames.has(player.id)) {
                        allPlayersInGames.set(player.id, player);
                    }
                });
            }
            if (game.teams.away.id === team.id && game.teams.away.roster) {
                game.teams.away.roster.forEach(player => {
                    if (!allPlayersInGames.has(player.id)) {
                        allPlayersInGames.set(player.id, player);
                    }
                });
            }
        });

        if (team.players) {
            team.players.forEach(player => {
                if (!allPlayersInGames.has(player.id)) {
                    allPlayersInGames.set(player.id, player);
                }
            });
        }

        return Array.from(allPlayersInGames.values());
    }, [team.players, games, team.id]);

    const handleDiscard = () => {
        setName(team.name);
        setLogoFile(null);
        setIsEditing(false);
        setErrors({});
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const error = Team.validateLogoFile(file);

            if (error) {
                setErrors(prev => ({...prev, logo: error}));
                return;
            }

            const fileNameError = await Team.validateLogoFileName(
                file.name,
                team.logo
            );

            if (fileNameError) {
                setErrors(prev => ({...prev, logo: fileNameError}));
                return;
            }

            setLogoFile(file);
            setErrors(prev => ({...prev, logo: ''}));
        } else {
            setLogoFile(null);
        }
    };

    const handleSave = async () => {
        try {
            const nameError = await TeamService.isNameTaken(name, team.id)
                ? "Team name is already taken"
                : null;

            if (nameError) {
                setErrors(prev => ({...prev, name: nameError}));
                return;
            }

            let logoUrl = team.logo;

            if (logoFile) {
                const logoNameError = await Team.validateLogoFileName(logoFile.name, team.logo);
                if (logoNameError) {
                    setErrors(prev => ({...prev, logo: logoNameError}));
                    return;
                }

                if (team.logo) {
                    await TeamService.deleteLogo(team.logo);
                }
                logoUrl = await TeamService.uploadLogo(logoFile);
            }

            const updatedTeam = new Team({
                ...team,
                name,
                logo: logoUrl
            });

            await TeamService.updateTeam(team.id, updatedTeam);
            setTeam(updatedTeam);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating team:', error);
            setErrors(prev => ({...prev, general: "Failed to update team. Please try again."}));
        }
    };

    const regularGames = getFilteredGames(GameType.REGULAR);
    const playoffGames = getFilteredGames(GameType.PLAYOFF);

    const playerRegularStatsMap: Record<string, any> = {};
    const playerPlayoffStatsMap: Record<string, any> = {};

    filteredPlayers.forEach(player => {
        playerRegularStatsMap[player.id] = Player.getPlayerStats(regularGames, player);
        playerPlayoffStatsMap[player.id] = Player.getPlayerStats(playoffGames, player);
    });

    const regularTeamStats = Team.getTeamStats(team, regularGames);
    const playoffTeamStats = Team.getTeamStats(team, playoffGames);

    return (
        <div className={styles.teamContainer}>
            <div className={styles.teamHeader}>
                <img src={team.logo} alt={team.name} className={styles.teamLogo}/>
                <h1>{team.name}</h1>
            </div>

            {isEditing ? (
                <div className={styles.editForm}>
                    <div>
                        <Input
                            label="Team name:"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            error={errors.name}
                        />

                        <Input
                            label="Upload new logo:"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            error={errors.logo}
                        />
                    </div>

                    {errors.general && <span style={{color: 'red'}}>{errors.general}</span>}
                    <div className={styles.buttonGroup}>
                        <Button styleType={"positive"} type="button" onClick={handleSave}>
                            Save Changes
                        </Button>
                        <Button styleType={"negative"} type="button" onClick={handleDiscard}>
                            Discard Changes
                        </Button>
                    </div>
                </div>
            ) : (
                <div className={styles.buttonGroup}>
                    <Button styleType={"neutral"} type="button" onClick={handleEdit}>
                        Edit Team
                    </Button>
                </div>
            )}

            <Select
                label="Season:"
                value={selectedSeason || "All"}
                onChange={e => setSelectedSeason(e.target.value as Season | 'All')}
                options={[
                    {value: "All", label: "All Seasons"},
                    ...Object.values(Season).map(season => ({
                        value: season,
                        label: season
                    }))
                ]}
            />

            <Select
                label="Championship:"
                value={selectedChampionship || "All"}
                onChange={e => setSelectedChampionship(e.target.value as Championship | 'All')}
                options={[
                    {value: "All", label: "All Championships"},
                    ...Object.values(Championship).map(champion => ({
                        value: champion,
                        label: champion
                    }))
                ]}
            />

            <div className={styles.statsSection}>
                <div className={styles.statsHeader} onClick={() => setShowPlayers(!showPlayers)}>
                    <h3>Players {filteredPlayers.length > 0 && `(${filteredPlayers.length})`}</h3>
                    <span>{showPlayers ? '▲' : '▼'}</span>
                </div>
                {showPlayers && (
                    <div>
                        {filteredPlayers.length > 0 && (
                            <>
                                <div>
                                    <h3>Regular Season Players Stats</h3>
                                    <PlayerTable pageType="team" players={filteredPlayers} games={regularGames}/>
                                </div>

                                <div>
                                    <h3>Playoff Players Stats</h3>
                                    <PlayerTable pageType="team" players={filteredPlayers} games={playoffGames}/>
                                    {/* Add distinctive line under playoff stats table */}
                                    <hr style={{margin: '2rem 0', border: '2px solid #ccc'}}/>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.statsSection}>
                <h3>Regular Season Team Stats</h3>
                <TeamTable stats={regularTeamStats}/>

                <h3>Playoff Team Stats</h3>
                <TeamTable stats={playoffTeamStats}/>
            </div>

            <div className={styles.statsSection}>
                <div className={styles.statsHeader} onClick={() => setShowGames(!showGames)}>
                    <h3>Team Games {getFilteredGames().length > 0 && `(${getFilteredGames().length})`}</h3>
                    <span>{showGames ? '▲' : '▼'}</span>
                </div>
                {showGames && (
                    <SavedGamesPage
                        key={getFilteredGames().map(g => g.id).join('-')}
                        playerGames={getFilteredGames()}
                        showFilters={false}
                    />
                )}
            </div>

            <div className={styles.buttonGroup}>
                <Button styleType={"negative"} type="button" onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        </div>
    );
};

export default HandleTeamPage;