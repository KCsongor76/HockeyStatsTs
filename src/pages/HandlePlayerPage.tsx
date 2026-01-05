import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {IPlayer} from "../OOP/interfaces/IPlayer";
import {IGame} from "../OOP/interfaces/IGame";
import {Position} from "../OOP/enums/Position";
import {PlayerService} from "../OOP/services/PlayerService";
import {ITeam} from "../OOP/interfaces/ITeam";
import {TeamService} from "../OOP/services/TeamService";
import {Championship} from "../OOP/enums/Championship";
import {Season} from "../OOP/enums/Season";
import {GameType} from "../OOP/enums/GameType";
import SavedGamesPage from "./SavedGamesPage";
import Button from "../components/Button";
import {TRANSFER} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";

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
        let availableTeamIds = new Set<string>();
        let availableChampionshipIds = new Set<string>();
        const teams: ITeam[] = [];
        const championships: Championship[] = [];

        games.forEach(g => {
            const isHomePlayer = g.teams.home.roster.some(p => p.id === player.id)
            const isAwayPlayer = g.teams.away.roster.some(p => p.id === player.id)
            if (!isHomePlayer && !isAwayPlayer) {
                return
            }
            const roster = isHomePlayer ? g.teams.home.roster : g.teams.away.roster;
            const team = isHomePlayer ? g.teams.home : g.teams.away

            if (roster.some(p => p.id === player.id)) {
                if (!availableTeamIds.has(team.id)) {
                    availableTeamIds.add(team.id);
                    teams.push(team);
                }
                if (!availableChampionshipIds.has(g.championship)) {
                    availableChampionshipIds.add(g.championship);
                    championships.push(g.championship);
                }
            }
        });

        return {availableTeams: teams, availableChampionships: championships};
    }

    const {availableTeams, availableChampionships} = getAvailableTeamsAndChampionships(player);

    const getFilteredGames = (type?: GameType) => {
        return games
            .filter(g => !type || g.type === type)
            .filter(g => !selectedSeason || g.season === selectedSeason)
            .filter(g => !selectedChampionship || g.championship === selectedChampionship)
            .filter(g => !selectedTeamId || g.teams.home.id === selectedTeamId || g.teams.away.id === selectedTeamId)
            .filter(g => g.teams.home.roster.some(p => p.id === player.id) || g.teams.away.roster.some(p => p.id === player.id));
    };

    const filteredGamesRegular = getFilteredGames(GameType.REGULAR)
    const filteredGamesPlayoff = getFilteredGames(GameType.PLAYOFF)

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
            await PlayerService.updatePlayer(player.teamId, player.id, {name, position, jerseyNumber});
            const updatedPlayer = {id: player.id, name, jerseyNumber, position, teamId: player.teamId} as IPlayer
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
            <div>
                <h1>Player Details</h1>
                <div>
                    <p>Name: {player.name}</p>
                    <p>Current team: {team?.name}</p>
                    <p>Position: {player.position}</p>
                    <p>Jersey number: {player.jerseyNumber}</p>
                </div>
            </div>

            {isEditing ? (
                <div>
                    <div>
                        <label htmlFor="name">Name:</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="jerseyNumber">Jersey number:</label>
                        <input
                            id="jerseyNumber"
                            type="number"
                            value={jerseyNumber}
                            onChange={(e) => setJerseyNumber(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <label htmlFor="position">Position:</label>
                        <select
                            id="position"
                            value={position}
                            onChange={(e) => setPosition(e.target.value as Position)}
                        >
                            {Object.values(Position).map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p>{error}</p>}
                    <div>
                        <Button styleType={"positive"} type="button" onClick={saveHandler}>Save Changes</Button>
                        <Button styleType={"negative"} type="button" onClick={() => setIsEditing(false)}>Discard
                            Changes</Button>
                    </div>
                </div>
            ) : (
                <div>
                    <Button styleType={"neutral"} type="button" onClick={() => setIsEditing(true)}>Edit player</Button>
                </div>
            )}

            <div>
                <label htmlFor="seasonFilter">Season:</label>
                <select
                    id="seasonFilter"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value as Season)}
                >
                    <option value="">All Seasons</option>
                    {Object.values(Season).map(season => (
                        <option key={season} value={season}>{season}</option>
                    ))}
                </select>
            </div>

            {availableTeams.length > 1 && (
                <div>
                    <label htmlFor="teamFilter">Team:</label>
                    <select
                        id="teamFilter"
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                    >
                        <option value="">All Teams</option>
                        {availableTeams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <h3>Regular Season Players Stats</h3>
                <div>
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
                            <th>H</th>
                            <th>T</th>
                            <th>S%</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{player.name}</td>
                            <td>{player.jerseyNumber}</td>
                            <td>{player.position}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).gamesPlayed || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).goals || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).assists || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).points || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).shots || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).hits || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesRegular, player).turnovers || 0}</td>
                            <td>{(Player.getPlayerStats(filteredGamesRegular, player).shotPercentage || 0).toFixed(2)}%</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3>Playoff Players Stats</h3>
                <div>
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
                            <th>H</th>
                            <th>T</th>
                            <th>S%</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{player.name}</td>
                            <td>{player.jerseyNumber}</td>
                            <td>{player.position}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).gamesPlayed || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).goals || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).assists || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).points || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).shots || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).hits || 0}</td>
                            <td>{Player.getPlayerStats(filteredGamesPlayoff, player).turnovers || 0}</td>
                            <td>{(Player.getPlayerStats(filteredGamesPlayoff, player).shotPercentage || 0).toFixed(2)}%</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
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

            <div>
                <Button
                    styleType={"positive"}
                    type="button"
                    onClick={() => navigate(`../${TRANSFER}/:${player.id}`, {state: {player, team}})}
                >
                    Transfer
                </Button>
                <Button
                    styleType={"negative"}
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Go back
                </Button>
            </div>
        </div>
    );
};

export default HandlePlayerPage;