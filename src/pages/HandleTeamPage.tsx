import React, {useMemo, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {TeamService} from "../OOP/services/TeamService";
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {IGame} from "../OOP/interfaces/IGame";
import {ITeam} from "../OOP/interfaces/ITeam";
import {ActionType} from "../OOP/enums/ActionType";
import {GameType} from "../OOP/enums/GameType";
import {PlayoffPeriod, RegularPeriod} from "../OOP/enums/Period";
import SavedGamesPage from "./SavedGamesPage";

const HandleTeamPage = () => {
    const location = useLocation();
    const [team, setTeam] = useState(location.state.team as ITeam);
    const games = location.state.games as IGame[];
    console.log(games)
    const [name, setName] = useState(team.name);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<Season | 'All'>('All');
    const [selectedChampionship, setSelectedChampionship] = useState<Championship | 'All'>('All');
    const [showPlayers, setShowPlayers] = useState<boolean>(false);
    const [showGames, setShowGames] = useState(false);
    const [sortConfigs, setSortConfigs] = useState<{
        regular: {
            key: "name" | "jerseyNumber" | "gamesPlayed" | "goals" | "assists" | "points" | "shots" | "shootingPercentage";
            direction: 'asc' | 'desc'
        } | null;
        playoff: {
            key: "name" | "jerseyNumber" | "gamesPlayed" | "goals" | "assists" | "points" | "shots" | "shootingPercentage";
            direction: 'asc' | 'desc'
        } | null;
    }>({regular: null, playoff: null});

    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    const getFilteredGames = (type?: GameType) => {
        const filteredGamesByTeam = games.filter(g => g.teams.home.id === team.id || g.teams.away.id === team.id);
        if (type) {
            const filteredGamesByType = filteredGamesByTeam.filter(game => game.type === type)
            const filteredGamesByChampionship = filteredGamesByType.filter(game => {
                if (selectedChampionship === "All") return true;
                return game.championship === selectedChampionship;
            });
            return filteredGamesByChampionship.filter(game => {
                if (selectedSeason === "All") return true;
                return game.season === selectedSeason;
            })
        } else {
            const filteredGamesByChampionship = filteredGamesByTeam.filter(game => {
                if (selectedChampionship === "All") return true;
                return game.championship === selectedChampionship;
            });
            return filteredGamesByChampionship.filter(game => {
                if (selectedSeason === "All") return true;
                return game.season === selectedSeason;
            })
        }
    }

    const filteredPlayers = useMemo(() => {
        // todo: add season and championship filter
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

    const getPlayerStats = (games: IGame[], player: IPlayer) => {
        const playerGames = games.filter(game => {
            const homePlayers = game.teams.home.roster || [];
            const awayPlayers = game.teams.away.roster || [];
            return homePlayers.some(p => p.id === player.id) ||
                awayPlayers.some(p => p.id === player.id);
        });

        let goals = 0;
        let shots = 0;
        let turnovers = 0;
        let hits = 0;
        let assists = 0;

        playerGames.forEach(game => {
            game.actions.forEach(action => {
                if (action.player?.id === player.id) {
                    switch (action.type) {
                        case ActionType.TURNOVER:
                            turnovers++;
                            break;
                        case ActionType.SHOT:
                            shots++;
                            break;
                        case ActionType.GOAL:
                            goals++;
                            shots++;
                            break;
                        case ActionType.HIT:
                            hits++;
                            break;
                    }
                }
                if (action.type === ActionType.GOAL &&
                    action.assists?.some(p => p.id === player.id)) {
                    assists++;
                }
            });
        });

        const gamesPlayed = playerGames.length;
        const shotPercentage = shots > 0 ? (goals / shots) * 100 : 0;
        const points = goals + assists;

        return {
            gamesPlayed,
            goals,
            assists,
            points,
            shots,
            turnovers,
            hits,
            shotPercentage
        };
    };

    const getTeamStats = (team: ITeam, games: IGame[]) => {
        let gamesPlayed = 0;
        let wins = 0;
        let otWins = 0;
        let losses = 0;
        let otLosses = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;
        let shots = 0;
        let turnovers = 0;
        let hits = 0;

        games.forEach(game => {
            const isHomeTeam = game.teams.home.id === team.id;
            const isAwayTeam = game.teams.away.id === team.id;

            if (!isHomeTeam && !isAwayTeam) return;

            gamesPlayed++;

            const teamScore = isHomeTeam ? game.score.home : game.score.away;
            const opponentScore = isHomeTeam ? game.score.away : game.score.home;

            goalsFor += teamScore.goals;
            goalsAgainst += opponentScore.goals;
            shots += teamScore.shots;
            turnovers += teamScore.turnovers;
            hits += teamScore.hits;

            if (game.type === GameType.REGULAR) {
                let highestPeriod = RegularPeriod.FIRST;
                game.actions.forEach(action => {
                    if (action.period.valueOf() > highestPeriod.valueOf()) {
                        highestPeriod = action.period;
                    }
                });
                if (teamScore.goals > opponentScore.goals) {
                    if (highestPeriod.valueOf() === RegularPeriod.OT.valueOf() || highestPeriod.valueOf() === RegularPeriod.SO.valueOf()) {
                        otWins++;
                    } else {
                        wins++;
                    }
                } else {
                    if (highestPeriod.valueOf() === RegularPeriod.OT.valueOf() || highestPeriod.valueOf() === RegularPeriod.SO.valueOf()) {
                        otLosses++;
                    } else {
                        losses++;
                    }
                }
            } else {
                let highestPeriod = PlayoffPeriod.FIRST;
                game.actions.forEach(action => {
                    if (action.period.valueOf() > highestPeriod.valueOf()) {
                        highestPeriod = action.period;
                    }
                });
                if (teamScore.goals > opponentScore.goals) {
                    if (highestPeriod.valueOf() > PlayoffPeriod.THIRD.valueOf()) {
                        otWins++;
                    } else {
                        wins++;
                    }
                } else {
                    if (highestPeriod.valueOf() > PlayoffPeriod.THIRD.valueOf()) {
                        otLosses++;
                    } else {
                        losses++;
                    }
                }
            }
        });

        const goalDifference = goalsFor - goalsAgainst;
        const shotPercentage = shots > 0 ? (goalsFor / shots) * 100 : 0;

        return {
            gamesPlayed,
            wins,
            otWins,
            losses,
            otLosses,
            goalsFor,
            goalsAgainst,
            goalDifference,
            shots,
            hits,
            turnovers,
            shotPercentage
        };
    };

    const handleDiscard = () => {
        setName(team.name);
        setLogoFile(null);
        setIsEditing(false);
        setErrors({});
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const getCurrentLogoFileName = (): string | null => {
        if (!team.logo) return null;
        try {
            const url = new URL(team.logo);
            const pathParts = url.pathname.split('/');
            const encodedFileName = pathParts[pathParts.length - 1];
            return decodeURIComponent(encodedFileName.split('?')[0]);
        } catch (error) {
            console.error('Error parsing logo URL:', error);
            return null;
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const allowedTypes = ['image/jpeg', 'image/png'];

            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({...prev, logo: 'Only .jpg and .png formats are allowed'}));
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({...prev, logo: "Logo must be less than 2MB"}));
                return;
            }

            const currentLogoFileName = getCurrentLogoFileName();
            if (currentLogoFileName && ("team-logos/" + file.name) === currentLogoFileName) {
                setErrors(prev => ({...prev, logo: 'Please choose a different file name'}));
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
                const logoError = await Team.validateLogo(logoFile.name);
                if (logoError) {
                    setErrors(prev => ({...prev, logo: logoError}));
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

    const handleSort = (key: "name" | "jerseyNumber" | "gamesPlayed" | "goals" | "assists" | "points" | "shots" | "shootingPercentage", isPlayoff: boolean) => {
        setSortConfigs(prev => {
            const currentConfig = isPlayoff ? prev.playoff : prev.regular;
            let direction: 'asc' | 'desc' = 'asc';

            if (currentConfig && currentConfig.key === key && currentConfig.direction === 'asc') {
                direction = 'desc';
            }

            return isPlayoff
                ? {...prev, playoff: {key, direction}}
                : {...prev, regular: {key, direction}};
        });
    };

    const sortPlayers = (players: IPlayer[], stats: Record<string, any>, sortConfig: {
        key: string;
        direction: 'asc' | 'desc'
    } | null) => {
        if (!sortConfig) return players;

        return [...players].sort((a, b) => {
            // Handle name and jerseyNumber differently as they're direct player properties
            if (sortConfig.key === 'name') {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                return sortConfig.direction === 'asc'
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }

            if (sortConfig.key === 'jerseyNumber') {
                return sortConfig.direction === 'asc'
                    ? a.jerseyNumber - b.jerseyNumber
                    : b.jerseyNumber - a.jerseyNumber;
            }

            // For stats, we need to use the stats object
            let statA, statB;

            // Handle shootingPercentage differently since it's stored as shotPercentage in the stats
            if (sortConfig.key === 'shootingPercentage') {
                statA = stats[a.id]['shotPercentage'] || 0;
                statB = stats[b.id]['shotPercentage'] || 0;
            } else {
                statA = stats[a.id][sortConfig.key] || 0;
                statB = stats[b.id][sortConfig.key] || 0;
            }

            return sortConfig.direction === 'asc'
                ? statA - statB
                : statB - statA;
        });
    };

    const getSortIndicator = (key: string, isPlayoff: boolean) => {
        const config = isPlayoff ? sortConfigs.playoff : sortConfigs.regular;
        if (config && config.key === key) {
            return config.direction === 'asc' ? '↑' : '↓';
        }
        return '';
    };

    // @ts-ignore
    return (
        <div>
            <img src={team.logo} alt={team.name} style={{width: '100px', height: '100px'}}/>
            <h1>{team.name}</h1>

            {isEditing ? (
                <div>
                    <div>
                        <label>
                            Team name:
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </label>
                        {errors.name && <span style={{color: 'red'}}>{errors.name}</span>}

                        <label>
                            Upload new logo:
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                            />
                        </label>
                        {errors.logo && <span style={{color: 'red'}}>{errors.logo}</span>}
                    </div>

                    {errors.general && <span style={{color: 'red'}}>{errors.general}</span>}
                    <div>
                        <button type="button" onClick={handleSave}>
                            Save Changes
                        </button>
                        <button type="button" onClick={handleDiscard}>
                            Discard Changes
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={handleEdit}>
                    Edit Team
                </button>
            )}

            <label>
                Season:
                <select
                    value={selectedSeason || "All"}
                    onChange={e => setSelectedSeason(e.target.value as Season | 'All')}
                >
                    <option value="All">All Seasons</option>
                    {Object.values(Season).map(season => (
                        <option key={season} value={season}>{season}</option>
                    ))}
                </select>
            </label>

            <label>
                Championship:
                <select
                    value={selectedChampionship || "All"}
                    onChange={e => setSelectedChampionship(e.target.value as Championship | 'All')}
                >
                    <option value="All">All Championships</option>
                    {Object.values(Championship).map(champion => (
                        <option key={champion} value={champion}>{champion}</option>
                    ))}
                </select>
            </label>

            <div>
                <div onClick={() => setShowPlayers(!showPlayers)}>
                    <h3>Players {filteredPlayers.length > 0 && `(${filteredPlayers.length})`}</h3>
                    <span>{showPlayers ? '▲' : '▼'}</span>
                </div>
                {showPlayers && (
                    <div>
                        {filteredPlayers.length > 0 && (
                            <>
                                <div>
                                    <h3>Regular Season Players Stats</h3>
                                    <table>
                                        <thead>
                                        <tr>
                                            <th onClick={() => handleSort('name', false)}>Name {getSortIndicator('name', false)}</th>
                                            <th onClick={() => handleSort('jerseyNumber', false)}># {getSortIndicator('jerseyNumber', false)}</th>
                                            <th>Position</th>
                                            <th onClick={() => handleSort('gamesPlayed', false)}>GP {getSortIndicator('gamesPlayed', false)}</th>
                                            <th onClick={() => handleSort('goals', false)}>G {getSortIndicator('goals', false)}</th>
                                            <th onClick={() => handleSort('assists', false)}>A {getSortIndicator('assists', false)}</th>
                                            <th onClick={() => handleSort('points', false)}>P {getSortIndicator('points', false)}</th>
                                            <th onClick={() => handleSort('shots', false)}>S {getSortIndicator('shots', false)}</th>
                                            <th onClick={() => handleSort('shootingPercentage', false)}>S% {getSortIndicator('shootingPercentage', false)}</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {(() => {
                                            const filteredGames = getFilteredGames(GameType.REGULAR);
                                            const playerStatsMap: Record<string, any> = {};
                                            filteredPlayers.forEach(player => {
                                                playerStatsMap[player.id] = getPlayerStats(filteredGames, player);
                                            });
                                            const sortedPlayers = sortPlayers(filteredPlayers, playerStatsMap, sortConfigs.regular);

                                            return sortedPlayers.map((player) => {
                                                const playerStats = playerStatsMap[player.id];
                                                return (
                                                    <tr key={player.id}>
                                                        <td>{player.name}</td>
                                                        <td>{player.jerseyNumber}</td>
                                                        <td>{player.position}</td>
                                                        <td>{playerStats.gamesPlayed || 0}</td>
                                                        <td>{playerStats.goals || 0}</td>
                                                        <td>{playerStats.assists || 0}</td>
                                                        <td>{playerStats.points || 0}</td>
                                                        <td>{playerStats.shots || 0}</td>
                                                        <td>{(playerStats.shotPercentage || 0).toFixed(2)}%</td>
                                                        <td>
                                                            <button
                                                                onClick={() => navigate(`../../handlePlayers/${player.id}`, {state: {player, games}})}
                                                            >
                                                                View Player
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h3>Playoff Players Stats</h3>
                                    <table>
                                        <thead>
                                        <tr>
                                            <th onClick={() => handleSort('name', true)}>Name {getSortIndicator('name', true)}</th>
                                            <th onClick={() => handleSort('jerseyNumber', true)}># {getSortIndicator('jerseyNumber', true)}</th>
                                            <th>Position</th>
                                            <th onClick={() => handleSort('gamesPlayed', true)}>GP {getSortIndicator('gamesPlayed', true)}</th>
                                            <th onClick={() => handleSort('goals', true)}>G {getSortIndicator('goals', true)}</th>
                                            <th onClick={() => handleSort('assists', true)}>A {getSortIndicator('assists', true)}</th>
                                            <th onClick={() => handleSort('points', true)}>P {getSortIndicator('points', true)}</th>
                                            <th onClick={() => handleSort('shots', true)}>S {getSortIndicator('shots', true)}</th>
                                            <th onClick={() => handleSort('shootingPercentage', true)}>S% {getSortIndicator('shootingPercentage', true)}</th>
                                            <th></th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {(() => {
                                            const filteredGames = getFilteredGames(GameType.PLAYOFF);
                                            const playerStatsMap: Record<string, any> = {};
                                            filteredPlayers.forEach(player => {
                                                playerStatsMap[player.id] = getPlayerStats(filteredGames, player);
                                            });
                                            const sortedPlayers = sortPlayers(filteredPlayers, playerStatsMap, sortConfigs.playoff);

                                            return sortedPlayers.map((player) => {
                                                const playerStats = playerStatsMap[player.id];
                                                return (
                                                    <tr key={player.id}>
                                                        <td>{player.name}</td>
                                                        <td>{player.jerseyNumber}</td>
                                                        <td>{player.position}</td>
                                                        <td>{playerStats.gamesPlayed || 0}</td>
                                                        <td>{playerStats.goals || 0}</td>
                                                        <td>{playerStats.assists || 0}</td>
                                                        <td>{playerStats.points || 0}</td>
                                                        <td>{playerStats.shots || 0}</td>
                                                        <td>{(playerStats.shotPercentage || 0).toFixed(2)}%</td>
                                                        <td>
                                                            <button
                                                                onClick={() => navigate(`../../handlePlayers/${player.id}`, {state: {player}})}
                                                            >
                                                                View Player
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div>
                <h3>Regular Season Team Stats</h3>
                <table>
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
                        {(() => {
                            const filteredGames = getFilteredGames(GameType.REGULAR);
                            const stats = getTeamStats(team, filteredGames);
                            return (
                                <>
                                    <td>{stats.gamesPlayed}</td>
                                    <td>{stats.wins}</td>
                                    <td>{stats.otWins}</td>
                                    <td>{stats.losses}</td>
                                    <td>{stats.otLosses}</td>
                                    <td>{stats.goalsFor}</td>
                                    <td>{stats.goalsAgainst}</td>
                                    <td>{stats.goalDifference}</td>
                                    <td>{stats.shots}</td>
                                    <td>{stats.hits ? stats.hits : 0}</td>
                                    <td>{stats.shotPercentage.toFixed(2)}%</td>
                                </>
                            );
                        })()}
                    </tr>
                    </tbody>
                </table>

                <h3>Playoff Team Stats</h3>
                <table>
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
                        {(() => {
                            const filteredGames = getFilteredGames(GameType.PLAYOFF);
                            const stats = getTeamStats(team, filteredGames);
                            return (
                                <>
                                    <td>{stats.gamesPlayed}</td>
                                    <td>{stats.wins}</td>
                                    <td>{stats.otWins}</td>
                                    <td>{stats.losses}</td>
                                    <td>{stats.otLosses}</td>
                                    <td>{stats.goalsFor}</td>
                                    <td>{stats.goalsAgainst}</td>
                                    <td>{stats.goalDifference}</td>
                                    <td>{stats.shots}</td>
                                    <td>{stats.hits ? stats.hits : 0}</td>
                                    <td>{stats.shotPercentage.toFixed(2)}%</td>
                                </>
                            );
                        })()}
                    </tr>
                    </tbody>
                </table>
            </div>

            <div>
                <div onClick={() => setShowGames(!showGames)}>
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

            <button type="button" onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );
};

export default HandleTeamPage;