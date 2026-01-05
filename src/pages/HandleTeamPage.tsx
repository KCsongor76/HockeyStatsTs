import React, {useMemo, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {Championship} from "../OOP/enums/Championship";
import {GameType} from "../OOP/enums/GameType";
import {Season} from "../OOP/enums/Season";
import {IGame} from "../OOP/interfaces/IGame";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import SavedGamesPage from "./SavedGamesPage";
import {Player} from "../OOP/classes/Player";
import Button from "../components/Button";
import styles from "./HandleTeamPage.module.css"
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";

type SortDirection = 'asc' | 'desc';
type PlayerSortField = 'name' | 'jerseyNumber' | 'position' | 'gamesPlayed' | 'goals' | 'assists' | 'points' | 'shots' | 'hits' | 'turnovers' | 'shotPercentage';

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
    const [championships, setChampionships] = useState<Championship[]>(team.championships || []);
    const navigate = useNavigate();
    const [playerSortField, setPlayerSortField] = useState<PlayerSortField>('name');
    const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('asc');

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

    // Filter players based on games they participated in for the selected filters
    const filteredPlayers = useMemo(() => {
        // Get all players who ever played for this team (including transferred/deleted ones)
        const allPlayersInGames = new Map<string, Player>();

        // Process all games to find players who played for this team
        games.forEach(game => {
            // Check if game matches current filters
            const matchesSeason = selectedSeason === 'All' || game.season === selectedSeason;
            const matchesChampionship = selectedChampionship === 'All' || game.championship === selectedChampionship;

            if (!matchesSeason || !matchesChampionship) return;

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

        // If "All Seasons" and "All Championships" are selected, include current team players
        // (to include those who haven't played yet but are on the roster)
        if (selectedSeason === 'All' && selectedChampionship === 'All' && team.players) {
            team.players.forEach(player => {
                if (!allPlayersInGames.has(player.id)) {
                    allPlayersInGames.set(player.id, player);
                }
            });
        }

        return Array.from(allPlayersInGames.values());
    }, [team.players, games, team.id, selectedSeason, selectedChampionship]);

    const handleDiscard = () => {
        setName(team.name);
        setLogoFile(null);
        setChampionships(team.championships || []);
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

    const toggleChampionship = (championship: Championship) => {
        setChampionships(prev =>
            prev.includes(championship)
                ? prev.filter(c => c !== championship)
                : [...prev, championship]
        );
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

            // Validate championships
            const championshipsError = Team.validateChampionships(championships);
            if (championshipsError) {
                setErrors(prev => ({...prev, championships: championshipsError}));
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
                logo: logoUrl,
                championships
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

    const handlePlayerSort = (field: PlayerSortField) => {
        if (playerSortField === field) {
            setPlayerSortDirection(playerSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPlayerSortField(field);
            setPlayerSortDirection('asc');
        }
    };

    const sortPlayers = (players: IPlayer[], games: IGame[]) => {
        return [...players].sort((a, b) => {
            const statsA = Player.getPlayerStats(games, a);
            const statsB = Player.getPlayerStats(games, b);

            let valueA: any;
            let valueB: any;

            switch (playerSortField) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'jerseyNumber':
                    valueA = a.jerseyNumber;
                    valueB = b.jerseyNumber;
                    break;
                case 'position':
                    valueA = a.position;
                    valueB = b.position;
                    break;
                case 'gamesPlayed':
                    valueA = statsA.gamesPlayed || 0;
                    valueB = statsB.gamesPlayed || 0;
                    break;
                case 'goals':
                    valueA = statsA.goals || 0;
                    valueB = statsB.goals || 0;
                    break;
                case 'assists':
                    valueA = statsA.assists || 0;
                    valueB = statsB.assists || 0;
                    break;
                case 'points':
                    valueA = statsA.points || 0;
                    valueB = statsB.points || 0;
                    break;
                case 'shots':
                    valueA = statsA.shots || 0;
                    valueB = statsB.shots || 0;
                    break;
                case 'hits':
                    valueA = statsA.hits || 0;
                    valueB = statsB.hits || 0;
                    break;
                case 'turnovers':
                    valueA = statsA.turnovers || 0;
                    valueB = statsB.turnovers || 0;
                    break;
                case 'shotPercentage':
                    valueA = statsA.shotPercentage || 0;
                    valueB = statsB.shotPercentage || 0;
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return playerSortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return playerSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const renderPlayerSortableHeader = (field: PlayerSortField, label: string) => (
        <th onClick={() => handlePlayerSort(field)} className={styles.sortableHeader} style={{cursor: 'pointer'}}>
            {label}
            {playerSortField === field && (
                <span>{playerSortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );

    return (
        <div className={styles.teamContainer}>
            <div className={styles.teamHeader}>
                {team.logo && team.id !== 'free-agent' && (
                    <img src={team.logo} alt={team.name} className={styles.teamLogo}/>
                )}
                <h1>{team.name}</h1>
            </div>

            {isEditing ? (
                <div className={styles.editForm}>
                    <div>
                        <div className={styles.inputContainer}>
                            <label htmlFor="teamName" className={styles.label}>Team name:</label>
                            <input
                                id="teamName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`${styles.input} ${errors.name ? styles.error : ''}`}
                            />
                            {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                        </div>

                        <div className={styles.inputContainer}>
                            <label htmlFor="teamLogo" className={styles.label}>Upload new logo:</label>
                            <input
                                id="teamLogo"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className={`${styles.input} ${errors.logo ? styles.error : ''}`}
                            />
                            {errors.logo && <span className={styles.errorMessage}>{errors.logo}</span>}
                        </div>

                        <div className={styles.championshipGroup}>
                            <label>Championships:</label>
                            {Object.values(Championship).map((championship) => (
                                <label key={championship}>
                                    {championship}
                                    <input
                                        type="checkbox"
                                        id={`champ-${championship}`}
                                        checked={championships.includes(championship)}
                                        onChange={() => toggleChampionship(championship)}
                                    />
                                </label>
                            ))}
                        </div>
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
                team.id !== 'free-agent' && (
                    <div className={styles.buttonGroup}>
                        <Button styleType={"neutral"} type="button" onClick={handleEdit}>
                            Edit Team
                        </Button>
                    </div>
                )
            )}

            <div className={styles.inputContainer}>
                <label htmlFor="seasonFilter" className={styles.label}>Season:</label>
                <select
                    id="seasonFilter"
                    value={selectedSeason || "All"}
                    onChange={e => setSelectedSeason(e.target.value as Season | 'All')}
                    className={styles.select}
                >
                    <option value="All">All Seasons</option>
                    {Object.values(Season).map(season => (
                        <option key={season} value={season}>{season}</option>
                    ))}
                </select>
            </div>

            <div className={styles.inputContainer}>
                <label htmlFor="championshipFilter" className={styles.label}>Championship:</label>
                <select
                    id="championshipFilter"
                    value={selectedChampionship || "All"}
                    onChange={e => setSelectedChampionship(e.target.value as Championship | 'All')}
                    className={styles.select}
                >
                    <option value="All">All Championships</option>
                    {Object.values(Championship).map(champ => (
                        <option key={champ} value={champ}>{champ}</option>
                    ))}
                </select>
            </div>

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
                                    <div className={styles.tableContainer}>
                                        <table className={styles.table}>
                                            <thead>
                                            <tr>
                                                {renderPlayerSortableHeader('name', 'Name')}
                                                {renderPlayerSortableHeader('jerseyNumber', '#')}
                                                {renderPlayerSortableHeader('position', 'Position')}
                                                {renderPlayerSortableHeader('gamesPlayed', 'GP')}
                                                {renderPlayerSortableHeader('goals', 'G')}
                                                {renderPlayerSortableHeader('assists', 'A')}
                                                {renderPlayerSortableHeader('points', 'P')}
                                                {renderPlayerSortableHeader('shots', 'S')}
                                                {renderPlayerSortableHeader('hits', 'H')}
                                                {renderPlayerSortableHeader('turnovers', 'T')}
                                                {renderPlayerSortableHeader('shotPercentage', 'S%')}
                                                <th></th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {sortPlayers(filteredPlayers, regularGames).map((player) => (
                                                <tr key={player.id}>
                                                    <td>{player.name}</td>
                                                    <td>{player.jerseyNumber}</td>
                                                    <td>{player.position}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).gamesPlayed || 0}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).goals || 0}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).assists || 0}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).points || 0}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).shots || 0}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).hits || 0}</td>
                                                    <td>{Player.getPlayerStats(regularGames, player).turnovers || 0}</td>
                                                    <td>{(Player.getPlayerStats(regularGames, player).shotPercentage || 0).toFixed(2)}%</td>
                                                    <td>
                                                        <Button styleType={"neutral"} onClick={() => navigate(`/${HANDLE_PLAYERS}/${player.id}`, {
                                                            state: {player, games}
                                                        })}>
                                                            View Player
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div>
                                    <h3>Playoff Players Stats</h3>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.table}>
                                            <thead>
                                            <tr>
                                                {renderPlayerSortableHeader('name', 'Name')}
                                                {renderPlayerSortableHeader('jerseyNumber', '#')}
                                                {renderPlayerSortableHeader('position', 'Position')}
                                                {renderPlayerSortableHeader('gamesPlayed', 'GP')}
                                                {renderPlayerSortableHeader('goals', 'G')}
                                                {renderPlayerSortableHeader('assists', 'A')}
                                                {renderPlayerSortableHeader('points', 'P')}
                                                {renderPlayerSortableHeader('shots', 'S')}
                                                {renderPlayerSortableHeader('hits', 'H')}
                                                {renderPlayerSortableHeader('turnovers', 'T')}
                                                {renderPlayerSortableHeader('shotPercentage', 'S%')}
                                                <th></th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {sortPlayers(filteredPlayers, playoffGames).map((player) => (
                                                <tr key={player.id}>
                                                    <td>{player.name}</td>
                                                    <td>{player.jerseyNumber}</td>
                                                    <td>{player.position}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).gamesPlayed || 0}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).goals || 0}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).assists || 0}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).points || 0}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).shots || 0}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).hits || 0}</td>
                                                    <td>{Player.getPlayerStats(playoffGames, player).turnovers || 0}</td>
                                                    <td>{(Player.getPlayerStats(playoffGames, player).shotPercentage || 0).toFixed(2)}%</td>
                                                    <td>
                                                        <Button styleType={"neutral"} onClick={() => navigate(`/${HANDLE_PLAYERS}/${player.id}`, {
                                                            state: {player, games}
                                                        })}>
                                                            View Player
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Add distinctive line under the playoff stats table */}
                                    <hr style={{margin: '2rem 0', border: '2px solid #ccc'}}/>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.statsSection}>
                <h3>Regular Season Team Stats</h3>
                {/*<TeamTable stats={regularTeamStats}/>*/}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>GP</th>
                            <th>W</th>
                            <th>OTW</th>
                            <th>L</th>
                            <th>OTL</th>
                            <th>GF</th>
                            <th>GA</th>
                            <th>GD</th>
                            <th>S</th>
                            <th>H</th>
                            <th>S%</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{regularTeamStats.gamesPlayed}</td>
                            <td>{regularTeamStats.wins}</td>
                            <td>{regularTeamStats.otWins}</td>
                            <td>{regularTeamStats.losses}</td>
                            <td>{regularTeamStats.otLosses}</td>
                            <td>{regularTeamStats.goalsFor}</td>
                            <td>{regularTeamStats.goalsAgainst}</td>
                            <td>{regularTeamStats.goalDifference}</td>
                            <td>{regularTeamStats.shots}</td>
                            <td>{regularTeamStats.hits ? regularTeamStats.hits : 0}</td>
                            <td>{regularTeamStats.shotPercentage.toFixed(2)}%</td>
                        </tr>
                        </tbody>
                    </table>
                </div>


                <h3>Playoff Team Stats</h3>
                {/*<TeamTable stats={playoffTeamStats}/>*/}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>GP</th>
                            <th>W</th>
                            <th>OTW</th>
                            <th>L</th>
                            <th>OTL</th>
                            <th>GF</th>
                            <th>GA</th>
                            <th>GD</th>
                            <th>S</th>
                            <th>H</th>
                            <th>S%</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{playoffTeamStats.gamesPlayed}</td>
                            <td>{playoffTeamStats.wins}</td>
                            <td>{playoffTeamStats.otWins}</td>
                            <td>{playoffTeamStats.losses}</td>
                            <td>{playoffTeamStats.otLosses}</td>
                            <td>{playoffTeamStats.goalsFor}</td>
                            <td>{playoffTeamStats.goalsAgainst}</td>
                            <td>{playoffTeamStats.goalDifference}</td>
                            <td>{playoffTeamStats.shots}</td>
                            <td>{playoffTeamStats.hits ? playoffTeamStats.hits : 0}</td>
                            <td>{playoffTeamStats.shotPercentage.toFixed(2)}%</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

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