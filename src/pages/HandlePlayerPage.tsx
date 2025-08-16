import React, {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {IGame} from "../OOP/interfaces/IGame";
import {Position} from "../OOP/enums/Position";
import {PlayerService} from "../OOP/services/PlayerService";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {ActionType} from "../OOP/enums/ActionType";
import {GameType} from "../OOP/enums/GameType";
import SavedGamesPage from "./SavedGamesPage";

const HandlePlayerPage = () => {
    const data = useLocation();
    const [player, setPlayer] = useState<IPlayer>(data.state.player);
    const games = data.state.games as IGame[];
    const [team, setTeam] = useState<ITeam | null>(null);

    const [name, setName] = useState<string>(player.name);
    const [position, setPosition] = useState<Position>(player.position);
    const [jerseyNumber, setJerseyNumber] = useState<number>(player.jerseyNumber);
    const [selectedSeason, setSelectedSeason] = useState<Season | "">("");
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [selectedChampionship, setSelectedChampionship] = useState<Championship | "">("");
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [showGames, setShowGames] = useState<boolean>(false);

    const navigate = useNavigate();

    const getAvailableTeamsAndChampionships = (player: IPlayer) => {
        let playerGames = [] as IGame[];
        let availableTeamIds = new Set<string>();
        let availableChampionshipIds = new Set<string>();
        const teams: ITeam[] = [];
        const championships: Championship[] = [];

        games.forEach(g => {
            if (g.teams.home.roster.some(p => p.id === player.id)) {
                if (!availableTeamIds.has(g.teams.home.id)) {
                    availableTeamIds.add(g.teams.home.id);
                    teams.push(g.teams.home);
                }
                if (!availableChampionshipIds.has(g.championship)) {
                    availableChampionshipIds.add(g.championship);
                    championships.push(g.championship);
                }
            }
            if (g.teams.away.roster.some(p => p.id === player.id)) {
                if (!availableTeamIds.has(g.teams.away.id)) {
                    availableTeamIds.add(g.teams.away.id);
                    teams.push(g.teams.away);
                }
                if (!availableChampionshipIds.has(g.championship)) {
                    availableChampionshipIds.add(g.championship);
                    championships.push(g.championship);
                }
            }

            if (g.teams.home.roster.some(p => p.id === player.id) || g.teams.away.roster.some(p => p.id === player.id)) {
                playerGames.push(g);
            }
        });

        return {
            playerGames,
            availableTeams: teams,
            availableChampionships: championships
        };
    }

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

    const {playerGames, availableTeams, availableChampionships} = getAvailableTeamsAndChampionships(player);

    // const filteredGames = useMemo(() => {
    //     let result = [...playerGames];
    //
    //     if (selectedSeason !== '') {
    //         result = result.filter(game => game.season === selectedSeason);
    //     }
    //
    //     if (selectedTeamId !== '') {
    //         result = result.filter(game =>
    //             game.teams.home.id === selectedTeamId ||
    //             game.teams.away.id === selectedTeamId
    //         );
    //     }
    //
    //     if (selectedChampionship !== '') {
    //         result = result.filter(game => game.championship === selectedChampionship);
    //     }
    //
    //     return result;
    // }, [playerGames, selectedSeason, selectedTeamId, selectedChampionship]);

    const getFilteredGames = (type?: GameType) => {
        const filteredGamesByTeam = games.filter(g => g.teams.home.id === team?.id || g.teams.away.id === team?.id);
        const filteredGamesByPlayer = filteredGamesByTeam.filter(g => g.teams.home.roster.some(p => p.id === player.id) || g.teams.away.roster.some(p => p.id === player.id))
        if (type) {
            const filteredGamesByType = filteredGamesByPlayer.filter(game => game.type === type)
            const filteredGamesByChampionship = filteredGamesByType.filter(game => {
                if (selectedChampionship === "") return true;
                return game.championship === selectedChampionship;
            });
            return filteredGamesByChampionship.filter(game => {
                if (selectedSeason === "") return true;
                return game.season === selectedSeason;
            })
        } else {
            const filteredGamesByChampionship = filteredGamesByPlayer.filter(game => {
                if (selectedChampionship === "") return true;
                return game.championship === selectedChampionship;
            });
            return filteredGamesByChampionship.filter(game => {
                if (selectedSeason === "") return true;
                return game.season === selectedSeason;
            })
        }
    }

    const filteredGamesRegular = getFilteredGames(GameType.REGULAR)
    const filteredGamesPlayoff = getFilteredGames(GameType.PLAYOFF)

    const regularStats = getPlayerStats(filteredGamesRegular, player);
    const playoffStats = getPlayerStats(filteredGamesPlayoff, player);

    const saveHandler = async () => {
        if (name === player.name && position === player.position && jerseyNumber === player.jerseyNumber) {
            setIsEditing(false);
            setError(null);
            return
        }

        if (jerseyNumber !== player.jerseyNumber) {
            try {
                if (isNaN(jerseyNumber)) {
                    setError(`Jersey number has to be a number.`);
                    return;
                }

                if (jerseyNumber < 1 || jerseyNumber > 99) {
                    setError(`Jersey number has to be between 1-99.`);
                    return;
                }

                const isAvailable = await PlayerService.isJerseyNumberAvailable(player.teamId, jerseyNumber);
                if (!isAvailable) {
                    setError(`Jersey number #${jerseyNumber} is already taken by another player in this team.`);
                    return;
                }
            } catch (e) {
                console.error("Failed to check jersey number availability:", error);
                setError('Failed to verify jersey number availability. Please try again.');
                return;
            }
        }

        setError(null);
        try {
            await PlayerService.updatePlayer(
                player.teamId,
                player.id,
                {name, position, jerseyNumber}
            );

            const updatedPlayer = {
                id: player.id,
                name,
                jerseyNumber,
                position,
                teamId: player.teamId, // Use player.teamId instead of team.id
            } as IPlayer

            setPlayer(updatedPlayer);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update player:", error);
            setError('Failed to update player. Please try again.');
        }
    }

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const teamData = await TeamService.getTeamById(player.teamId);
                setTeam(teamData);
            } catch (error) {
                console.error("Failed to fetch team:", error);
                setTeam(null);
            }
        };

        fetchTeam();
    }, [player.teamId]);

    return (
        <div>
            <p>Name: {player.name}</p>
            <p>Team: {team?.name}</p>
            <p>Position: {player.position}</p>
            <p>Jersey number: {player.jerseyNumber}</p>

            {isEditing ? (
                <>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>

                    <label>
                        Jersey number:
                        <input
                            type="number"
                            value={jerseyNumber}
                            onChange={(e) => setJerseyNumber(Number(e.target.value))}
                        />
                    </label>

                    <label>
                        Position:
                        <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value as Position)}
                        >
                            {Object.values(Position).map((position) => (
                                <option key={position} value={position}>{position}</option>
                            ))}
                        </select>
                    </label>
                    {error && <p>{error}</p>}
                    <button type="button" onClick={saveHandler}>Save Changes</button>
                    <button type="button" onClick={() => setIsEditing(false)}>Discard Changes</button>
                </>
            ) : <button type="button" onClick={() => setIsEditing(true)}>Edit player</button>}

            <label>
                Season:
                <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value as Season)}
                >
                    <option value="">All Seasons</option>
                    {Object.values(Season).map((season) => (
                        <option key={season} value={season}>{season}</option>
                    ))}
                </select>
            </label>

            {availableTeams.length > 1 &&
                <label>
                    Team:
                    <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        <option value="">All Teams</option>
                        {availableTeams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </label>
            }

            {/*{availableChampionships.length > 1 &&*/}
            {/*    <label>*/}
            {/*        Championship:*/}
            {/*        <select*/}
            {/*            value={selectedChampionship}*/}
            {/*            onChange={(e) => setSelectedChampionship(e.target.value as Championship)}*/}
            {/*        >*/}
            {/*            <option value="">All Championships</option>*/}
            {/*            {availableChampionships.map((c) => (*/}
            {/*                <option key={c} value={c}>{c}</option>*/}
            {/*            ))}*/}
            {/*        </select>*/}
            {/*    </label>*/}
            {/*}*/}

            <div>
                <h3>Regular Season Players Stats</h3>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>#</th>
                        <th>Position</th>
                        <th>GP</th>
                        <th>G</th>
                        <th>A</th>
                        <th>P</th>
                        <th>S</th>
                        <th>S%</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player.jerseyNumber}</td>
                        <td>{player.position}</td>
                        <td>{regularStats.gamesPlayed || 0}</td>
                        <td>{regularStats.goals || 0}</td>
                        <td>{regularStats.assists || 0}</td>
                        <td>{regularStats.points || 0}</td>
                        <td>{regularStats.shots || 0}</td>
                        <td>{(regularStats.shotPercentage || 0).toFixed(2)}%</td>
                        <td>
                            <button
                                onClick={() => navigate(`../../handlePlayers/${player.id}`, {
                                    state: {
                                        player,
                                        games
                                    }
                                })}
                            >
                                View Player
                            </button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <div>
                <h3>Playoff Players Stats</h3>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>#</th>
                        <th>Position</th>
                        <th>GP</th>
                        <th>G</th>
                        <th>A</th>
                        <th>P</th>
                        <th>S</th>
                        <th>S%</th>
                        <th></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr key={player.id}>
                        <td>{player.name}</td>
                        <td>{player.jerseyNumber}</td>
                        <td>{player.position}</td>
                        <td>{playoffStats.gamesPlayed || 0}</td>
                        <td>{playoffStats.goals || 0}</td>
                        <td>{playoffStats.assists || 0}</td>
                        <td>{playoffStats.points || 0}</td>
                        <td>{playoffStats.shots || 0}</td>
                        <td>{(playoffStats.shotPercentage || 0).toFixed(2)}%</td>
                        <td>
                            <button
                                onClick={() => navigate(`../../handlePlayers/${player.id}`, {state: {player}})}
                            >
                                View Player
                            </button>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <div>
                <div onClick={() => setShowGames(!showGames)}>
                    <h3>Games Played {getFilteredGames().length > 0 && `(${getFilteredGames().length})`}</h3>
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

            <button
                type="button"
                onClick={() => navigate(`../transfer/:${player.id}`, {state: {player, team}})}
            >
                Transfer
            </button>
            <button type="button" onClick={() => navigate(-1)}>Go back</button>
        </div>
    );
};

export default HandlePlayerPage;