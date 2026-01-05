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
import {Player, PlayerSortField} from "../OOP/classes/Player";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import Checkbox from "../components/Checkbox";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import {Game} from "../OOP/classes/Game";

type SortDirection = 'asc' | 'desc';

interface StatsData {
    gamesPlayed: number;
    wins: number;
    otWins: number;
    losses: number;
    otLosses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    shots: number;
    hits: number;
    shotPercentage: number;
}

interface SeasonalStats {
    season: string;
    stats: StatsData;
}

const TeamStatsTable = ({
                            title,
                            totalStats,
                            seasonalStats,
                            showSeasonColumn
                        }: {
    title: string;
    totalStats: StatsData;
    seasonalStats: SeasonalStats[];
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
                {/* Render Individual Season Rows if 'All' is selected */}
                {showSeasonColumn && seasonalStats.map((row) => (
                    <tr key={row.season}>
                        <td>{row.season}</td>
                        <td>{row.stats.gamesPlayed}</td>
                        <td>{row.stats.wins}</td>
                        <td>{row.stats.otWins}</td>
                        <td>{row.stats.losses}</td>
                        <td>{row.stats.otLosses}</td>
                        <td>{row.stats.goalsFor}</td>
                        <td>{row.stats.goalsAgainst}</td>
                        <td>{row.stats.goalDifference}</td>
                        <td>{row.stats.shots}</td>
                        <td>{row.stats.hits || 0}</td>
                        <td>{row.stats.shotPercentage.toFixed(2)}%</td>
                    </tr>
                ))}

                {/* Render Total/Aggregate Row */}
                <tr>
                    {showSeasonColumn && <td>Total</td>}
                    <td>{totalStats.gamesPlayed}</td>
                    <td>{totalStats.wins}</td>
                    <td>{totalStats.otWins}</td>
                    <td>{totalStats.losses}</td>
                    <td>{totalStats.otLosses}</td>
                    <td>{totalStats.goalsFor}</td>
                    <td>{totalStats.goalsAgainst}</td>
                    <td>{totalStats.goalDifference}</td>
                    <td>{totalStats.shots}</td>
                    <td>{totalStats.hits || 0}</td>
                    <td>{totalStats.shotPercentage.toFixed(2)}%</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};


const HandleTeamPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const games = useMemo(() =>
            (location.state.games as IGame[]).map(g => new Game(g)),
        [location.state.games]);

    const [team, setTeam] = useState<Team>(() => new Team(location.state.team as ITeam));

    const [name, setName] = useState(team.name);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<Season | 'All'>('All');
    const [selectedChampionship, setSelectedChampionship] = useState<Championship | 'All'>('All');
    const [showPlayers, setShowPlayers] = useState<boolean>(false);
    const [showGames, setShowGames] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [championships, setChampionships] = useState<Championship[]>(team.championships || []);

    const [playerSortField, setPlayerSortField] = useState<PlayerSortField>('name');
    const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('asc');

    const relevantGames = useMemo(() => {
        return games.filter(g =>
            (g.teams.home.id === team.id || g.teams.away.id === team.id) &&
            (selectedSeason === 'All' || g.season === selectedSeason) &&
            (selectedChampionship === 'All' || g.championship === selectedChampionship)
        );
    }, [games, team.id, selectedSeason, selectedChampionship]);

    const regularGames = useMemo(() => relevantGames.filter(g => g.type === GameType.REGULAR), [relevantGames]);
    const playoffGames = useMemo(() => relevantGames.filter(g => g.type === GameType.PLAYOFF), [relevantGames]);

    const getFilteredGames = (type?: GameType): Game[] => {
        return relevantGames.filter(g => !type || g.type === type);
    };

    const filteredPlayers = useMemo(() => {
        const includeRoster = selectedSeason === 'All' && selectedChampionship === 'All';
        return Team.getParticipatingPlayers(team.id, relevantGames, includeRoster ? team.players : []);
    }, [team.id, team.players, relevantGames, selectedSeason, selectedChampionship]);

    const playerStatsCache = useMemo(() => {
        const cache = new Map<string, { regular: any, playoff: any }>();
        filteredPlayers.forEach(p => {
            cache.set(p.id, {
                regular: Player.getPlayerStats(regularGames, p),
                playoff: Player.getPlayerStats(playoffGames, p)
            });
        });
        return cache;
    }, [filteredPlayers, regularGames, playoffGames]);

    const seasonalStats = useMemo(() => {
        if (selectedSeason !== 'All') return {regular: [], playoff: []};

        const distinctSeasons = Array.from(new Set(relevantGames.map(g => g.season)))
            .filter(Boolean)
            .sort()
            .reverse();

        const regular = distinctSeasons.map(season => ({
            season,
            stats: Team.getTeamStats(team, regularGames.filter(g => g.season === season)) as StatsData
        }));

        const playoff = distinctSeasons.map(season => ({
            season,
            stats: Team.getTeamStats(team, playoffGames.filter(g => g.season === season)) as StatsData
        }));

        return {regular, playoff};
    }, [selectedSeason, relevantGames, regularGames, playoffGames, team]);

    const regularTeamStats = useMemo(() => Team.getTeamStats(team, regularGames) as StatsData, [team, regularGames]);
    const playoffTeamStats = useMemo(() => Team.getTeamStats(team, playoffGames) as StatsData, [team, playoffGames]);

    const handleDiscard = () => {
        setName(team.name);
        setLogoFile(null);
        setChampionships(team.championships || []);
        setIsEditing(false);
        setErrors({});
    };

    const handleEdit = () => setIsEditing(true);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const error = Team.validateLogoFile(file);
            if (error) {
                setErrors(prev => ({...prev, logo: error}));
                return;
            }

            const fileNameError = await Team.validateLogoFileName(file.name, team.logo);
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
        setChampionships(prev => prev.includes(championship) ? prev.filter(c => c !== championship) : [...prev, championship]);
    };

    const handleSave = async () => {
        try {
            const nameError = await TeamService.isNameTaken(name, team.id) ? "Team name is already taken" : null;
            if (nameError) {
                setErrors(prev => ({...prev, name: nameError}));
                return;
            }

            const championshipsError = Team.validateChampionships(championships);
            if (championshipsError) {
                setErrors(prev => ({...prev, championships: championshipsError}));
                return;
            }

            let logoUrl = team.logo;
            if (logoFile) {
                if (team.logo) await TeamService.deleteLogo(team.logo);
                logoUrl = await TeamService.uploadLogo(logoFile);
            }

            const updatedTeam = new Team({...team, name, logo: logoUrl, championships});
            await TeamService.updateTeam(team.id, updatedTeam);
            setTeam(updatedTeam);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating team:', error);
            setErrors(prev => ({...prev, general: "Failed to update team. Please try again."}));
        }
    };

    const handlePlayerSort = (field: PlayerSortField) => {
        if (playerSortField === field) {
            setPlayerSortDirection(playerSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPlayerSortField(field);
            setPlayerSortDirection('asc');
        }
    };

    const renderPlayerSortableHeader = (field: PlayerSortField, label: string) => (
        <th onClick={() => handlePlayerSort(field)}>
            {label}
            {playerSortField === field && (<span>{playerSortDirection === 'asc' ? ' ↑' : ' ↓'}</span>)}
        </th>
    );

    // Filter Options
    const seasonOptions = [
        {value: "All", label: "All Seasons"},
        ...Object.values(Season).map(season => ({value: season, label: season}))
    ];
    const championshipOptions = [
        {value: "All", label: "All Championships"},
        ...Object.values(Championship).map(champ => ({value: champ, label: champ}))
    ];

    return (
        <>
            {team.logo && team.id !== 'free-agent' && (<img src={team.logo} alt={team.name}/>)}
                <h1>{team.name}</h1>

            {isEditing ? (
                <>
                    <Input
                        id="teamName"
                        label="Team name:"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                    />

                    <Input
                        id="teamLogo"
                        label="Upload new logo:"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        error={errors.logo}
                    />

                    <h3>Championships:</h3>
                    {Object.values(Championship).map((championship) => (
                        <Checkbox
                            key={championship}
                            id={`champ-${championship}`}
                            label={championship}
                            checked={championships.includes(championship)}
                            onChange={() => toggleChampionship(championship)}
                        />
                    ))}

                    {errors.championships && <span>{errors.championships}</span>}
                    {errors.general && <span>{errors.general}</span>}

                    <div>
                        <Button styleType={"positive"} type="button" onClick={handleSave}>Save Changes</Button>
                        <Button styleType={"negative"} type="button" onClick={handleDiscard}>Discard Changes</Button>
                    </div>

                </>
            ) : (
                team.id !== 'free-agent' &&
                <Button styleType={"neutral"} type="button" onClick={handleEdit}>Edit Team</Button>
            )}

                <div>
                    <Select
                        id="seasonFilter"
                        label="Season:"
                        value={selectedSeason || "All"}
                        onChange={e => setSelectedSeason(e.target.value as Season | 'All')}
                        options={seasonOptions}
                    />

                    <Select
                        id="championshipFilter"
                        label="Championship:"
                        value={selectedChampionship || "All"}
                        onChange={e => setSelectedChampionship(e.target.value as Championship | 'All')}
                        options={championshipOptions}
                    />
                </div>

                <div onClick={() => setShowPlayers(!showPlayers)}>
                    <h3>Players {filteredPlayers.length > 0 && `(${filteredPlayers.length})`}</h3>
                    <span>{showPlayers ? '▲' : '▼'}</span>
                </div>

                {showPlayers && (
                    <>
                        {filteredPlayers.length > 0 && (
                            <>
                                <h3>Regular Season Players Stats</h3>
                                <table>
                                    <thead>
                                    <tr>
                                        {renderPlayerSortableHeader('name', 'Name')}
                                        {renderPlayerSortableHeader('jerseyNumber', '#')}
                                        {renderPlayerSortableHeader('position', 'Pos')}
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
                                    {Player.sort(
                                        filteredPlayers,
                                        new Map(filteredPlayers.map(p => [p.id, playerStatsCache.get(p.id)?.regular])),
                                        playerSortField,
                                        playerSortDirection
                                    ).map((player) => {
                                        const stats = playerStatsCache.get(player.id)?.regular || {};
                                        return (
                                            <tr key={player.id}>
                                                <td>{player.name}</td>
                                                <td>{player.jerseyNumber}</td>
                                                <td>{player.position}</td>
                                                <td>{stats.gamesPlayed || 0}</td>
                                                <td>{stats.goals || 0}</td>
                                                <td>{stats.assists || 0}</td>
                                                <td>{stats.points || 0}</td>
                                                <td>{stats.shots || 0}</td>
                                                <td>{stats.hits || 0}</td>
                                                <td>{stats.turnovers || 0}</td>
                                                <td>{(stats.shotPercentage || 0).toFixed(2)}%</td>
                                                <td>
                                                    <Button styleType={"neutral"}
                                                            onClick={() => navigate(`/${HANDLE_PLAYERS}/${player.id}`, {
                                                                state: {
                                                                    player,
                                                                    games
                                                                }
                                                            })}>
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>


                                <h3>Playoff Players Stats</h3>

                                <table>
                                    <thead>
                                    <tr>
                                        {renderPlayerSortableHeader('name', 'Name')}
                                        {renderPlayerSortableHeader('jerseyNumber', '#')}
                                        {renderPlayerSortableHeader('position', 'Pos')}
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
                                    {Player.sort(
                                        filteredPlayers,
                                        new Map(filteredPlayers.map(p => [p.id, playerStatsCache.get(p.id)?.playoff])),
                                        playerSortField,
                                        playerSortDirection
                                    ).map((player) => {
                                        const stats = playerStatsCache.get(player.id)?.playoff || {};
                                        return (
                                            <tr key={player.id}>
                                                <td>{player.name}</td>
                                                <td>{player.jerseyNumber}</td>
                                                <td>{player.position}</td>
                                                <td>{stats.gamesPlayed || 0}</td>
                                                <td>{stats.goals || 0}</td>
                                                <td>{stats.assists || 0}</td>
                                                <td>{stats.points || 0}</td>
                                                <td>{stats.shots || 0}</td>
                                                <td>{stats.hits || 0}</td>
                                                <td>{stats.turnovers || 0}</td>
                                                <td>{(stats.shotPercentage || 0).toFixed(2)}%</td>
                                                <td>
                                                    <Button styleType={"neutral"}
                                                            onClick={() => navigate(`/${HANDLE_PLAYERS}/${player.id}`, {
                                                                state: {
                                                                    player,
                                                                    games
                                                                }
                                                            })}>
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </>
                )}

                <TeamStatsTable
                    title="Regular Season Team Stats"
                    totalStats={regularTeamStats}
                    seasonalStats={seasonalStats.regular}
                    showSeasonColumn={selectedSeason === 'All'}
                />

                <TeamStatsTable
                    title="Playoff Team Stats"
                    totalStats={playoffTeamStats}
                    seasonalStats={seasonalStats.playoff}
                    showSeasonColumn={selectedSeason === 'All'}
                />

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

                <Button styleType={"negative"} type="button" onClick={() => navigate(-1)}>Go Back</Button>
        </>
    );
};

export default HandleTeamPage;