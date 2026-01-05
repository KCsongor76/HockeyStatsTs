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
import {GameType} from "../OOP/enums/GameType";
import SavedGamesPage from "./SavedGamesPage";
import Button from "../components/Button";
import {TRANSFER} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";
import {Game} from "../OOP/classes/Game";

interface PlayerStatsData {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    shots: number;
    hits: number;
    turnovers: number;
    shotPercentage: number;
}

interface SeasonalPlayerStats {
    season: string;
    stats: PlayerStatsData;
}

const PlayerStatsTable = ({
                              title,
                              totalStats,
                              seasonalStats,
                              showSeasonColumn
                          }: {
    title: string;
    totalStats: PlayerStatsData;
    seasonalStats: SeasonalPlayerStats[];
    showSeasonColumn: boolean;
}) => {
    return (
        <div>
            <h3>{title}</h3>
            <table>
                <thead>
                <tr>
                    {showSeasonColumn && <th>Season</th>}
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
                {/* Seasonal Rows */}
                {showSeasonColumn && seasonalStats.map((row) => (
                    <tr key={row.season}>
                        <td>{row.season}</td>
                        <td>{row.stats.gamesPlayed}</td>
                        <td>{row.stats.goals}</td>
                        <td>{row.stats.assists}</td>
                        <td>{row.stats.points}</td>
                        <td>{row.stats.shots}</td>
                        <td>{row.stats.hits}</td>
                        <td>{row.stats.turnovers}</td>
                        <td>{row.stats.shotPercentage.toFixed(2)}%</td>
                    </tr>
                ))}

                {/* Total Row */}
                <tr>
                    {showSeasonColumn && <td>Total</td>}
                    <td>{totalStats.gamesPlayed}</td>
                    <td>{totalStats.goals}</td>
                    <td>{totalStats.assists}</td>
                    <td>{totalStats.points}</td>
                    <td>{totalStats.shots}</td>
                    <td>{totalStats.hits}</td>
                    <td>{totalStats.turnovers}</td>
                    <td>{totalStats.shotPercentage.toFixed(2)}%</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};


const HandlePlayerPage = () => {
    const data = useLocation();
    const navigate = useNavigate();

    const games = useMemo(() =>
            (data.state.games as IGame[]).map(g => new Game(g)),
        [data.state.games]);

    const [player, setPlayer] = useState<Player>(() => {
        const p = data.state.player as IPlayer;
        return new Player(p.id, p.jerseyNumber, p.name, p.position, p.teamId);
    });

    const [team, setTeam] = useState<ITeam | null>(null);

    const [name, setName] = useState<string>(player.name);
    const [position, setPosition] = useState<Position>(player.position);
    const [jerseyNumber, setJerseyNumber] = useState<number>(player.jerseyNumber);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedSeason, setSelectedSeason] = useState<Season | 'All'>('All');
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [selectedChampionship, setSelectedChampionship] = useState<Championship | "">("");
    const [showGames, setShowGames] = useState<boolean>(false);

    const {availableTeams} = useMemo(() => {
        let availableTeamIds = new Set<string>();
        const teams: ITeam[] = [];

        games.forEach(g => {
            const homeRoster = g.teams.home.roster || [];
            const awayRoster = g.teams.away.roster || [];
            const isHome = homeRoster.some(p => p.id === player.id);
            const isAway = awayRoster.some(p => p.id === player.id);

            if (isHome) {
                if (!availableTeamIds.has(g.teams.home.id)) {
                    availableTeamIds.add(g.teams.home.id);
                    teams.push(g.teams.home);
                }
            }
            if (isAway) {
                if (!availableTeamIds.has(g.teams.away.id)) {
                    availableTeamIds.add(g.teams.away.id);
                    teams.push(g.teams.away);
                }
            }
        });
        return {availableTeams: teams};
    }, [games, player.id]);

    const relevantGames = useMemo(() => {
        return games.filter(g => {
            // Check filters
            if (selectedSeason !== 'All' && g.season !== selectedSeason) return false;
            if (selectedChampionship && g.championship !== selectedChampionship) return false;
            if (selectedTeamId && g.teams.home.id !== selectedTeamId && g.teams.away.id !== selectedTeamId) return false;

            // Check participation
            const homeHasPlayer = g.teams.home.roster?.some(p => p.id === player.id);
            const awayHasPlayer = g.teams.away.roster?.some(p => p.id === player.id);
            return homeHasPlayer || awayHasPlayer;
        });
    }, [games, selectedSeason, selectedChampionship, selectedTeamId, player.id]);

    const regularGames = useMemo(() => relevantGames.filter(g => g.type === GameType.REGULAR), [relevantGames]);
    const playoffGames = useMemo(() => relevantGames.filter(g => g.type === GameType.PLAYOFF), [relevantGames]);

    const calculateSeasonalStats = (gamesSubset: Game[]) => {
        if (selectedSeason !== 'All') return [];

        const distinctSeasons = Array.from(new Set(relevantGames.map(g => g.season)))
            .filter(Boolean)
            .sort()
            .reverse();

        return distinctSeasons.map(season => ({
            season,
            stats: Player.getPlayerStats(gamesSubset.filter(g => g.season === season), player) as PlayerStatsData
        }));
    };

    const seasonalStats = useMemo(() => ({
        regular: calculateSeasonalStats(regularGames),
        playoff: calculateSeasonalStats(playoffGames)
    }), [regularGames, playoffGames, selectedSeason, player]);

    const totalStats = useMemo(() => ({
        regular: Player.getPlayerStats(regularGames, player) as PlayerStatsData,
        playoff: Player.getPlayerStats(playoffGames, player) as PlayerStatsData
    }), [regularGames, playoffGames, player]);

    const saveHandler = async () => {
        if (name === player.name && position === player.position && jerseyNumber === player.jerseyNumber) {
            setIsEditing(false);
            setError(null);
            return;
        }

        if (jerseyNumber !== player.jerseyNumber) {
            const err = Player.validateJerseyNumber(jerseyNumber);
            if (err) {
                setError(err);
                return;
            }
            try {
                const isAvailable = await PlayerService.isJerseyNumberAvailable(player.teamId, jerseyNumber);
                if (!isAvailable) {
                    setError(`Jersey number #${jerseyNumber} is already taken.`);
                    return;
                }
            } catch (e) {
                setError('Failed to verify jersey number.');
                return;
            }
        }

        try {
            await PlayerService.updatePlayer(player.teamId, player.id, {name, position, jerseyNumber});
            const updatedPlayer = new Player(player.id, jerseyNumber, name, position as Position, player.teamId);
            setPlayer(updatedPlayer);
            setIsEditing(false);
            setError(null);
        } catch (error) {
            console.error("Failed to update player:", error);
            setError('Failed to update player.');
        }
    };

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const teamData = await TeamService.getTeamById(player.teamId);
                setTeam(teamData);
            } catch (error) {
                setTeam(null);
            }
        };
        fetchTeam();
    }, [player.teamId]);

    return (
        <>
            <h1>Player Details</h1>
            <p>Name: {player.name}</p>
            <p>Current team: {team?.name}</p>
            <p>Position: {player.position}</p>
            <p>Jersey number: {player.jerseyNumber}</p>

            {isEditing ? (
                <>
                    <label htmlFor="name">Name:</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <label htmlFor="jerseyNumber">Jersey number:</label>
                    <input
                        id="jerseyNumber"
                        type="number"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    />

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

                    {error && <p className="error">{error}</p>}
                    <Button styleType={"positive"} type="button" onClick={saveHandler}>Save Changes</Button>
                    <Button styleType={"negative"} type="button" onClick={() => setIsEditing(false)}>Discard</Button>
                </>
            ) : (
                <Button styleType={"neutral"} type="button" onClick={() => setIsEditing(true)}>Edit player</Button>
            )}


            <label htmlFor="seasonFilter">Season:</label>
            <select
                id="seasonFilter"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value as Season | 'All')}
            >
                <option value="All">All Seasons</option>
                {Object.values(Season).map(season => (
                    <option key={season} value={season}>{season}</option>
                ))}
            </select>

            {availableTeams.length > 1 && (
                <>
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
                </>
            )}

            <PlayerStatsTable
                title="Regular Season Players Stats"
                totalStats={totalStats.regular}
                seasonalStats={seasonalStats.regular}
                showSeasonColumn={selectedSeason === 'All'}
            />

            <PlayerStatsTable
                title="Playoff Players Stats"
                totalStats={totalStats.playoff}
                seasonalStats={seasonalStats.playoff}
                showSeasonColumn={selectedSeason === 'All'}
            />


            <div onClick={() => setShowGames(!showGames)}>
                <h3>Games Played {relevantGames.length > 0 && `(${relevantGames.length})`}</h3>
                <span>{showGames ? '▲' : '▼'}</span>
            </div>

            {showGames && (
                <SavedGamesPage
                    // Unique key to force re-render when filters change
                    key={`${selectedSeason}-${selectedTeamId}-${relevantGames.length}`}
                    playerGames={relevantGames}
                    showFilters={false}
                />
            )}

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
        </>
    );
};

export default HandlePlayerPage;