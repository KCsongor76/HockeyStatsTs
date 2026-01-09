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
import Select from "../components/Select";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import {Game} from "../OOP/classes/Game";
import TeamForm, {TeamFormData} from "../components/forms/TeamForm";
import TeamStatsTable, {TeamStatsData} from "../components/tables/TeamStatsTable";
import PlayerStatsTable, {PlayerStatsData} from "../components/tables/PlayerStatsTable";
import SavedGamesPage2 from "./SavedGamesPage2";

type SortDirection = 'asc' | 'desc';

const HandleTeamPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const games = useMemo(() =>
            (location.state.games as IGame[]).map(g => new Game(g)),
        [location.state.games]);

    const [team, setTeam] = useState<Team>(() => new Team(location.state.team as ITeam));

    const [isEditing, setIsEditing] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<Season | 'All'>('All');
    const [selectedChampionship, setSelectedChampionship] = useState<Championship | 'All'>('All');
    const [showPlayers, setShowPlayers] = useState<boolean>(false);
    const [showGames, setShowGames] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [playerSortField, setPlayerSortField] = useState<PlayerSortField>('name');
    const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('asc');

    const relevantGames = useMemo(() => {
        return Team.filterGames(team.id, games, selectedSeason, selectedChampionship);
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
        return Player.calculateRosterStats(filteredPlayers, regularGames, playoffGames);
    }, [filteredPlayers, regularGames, playoffGames]);

    const seasonalStats = useMemo(() => {
        if (selectedSeason !== 'All') return {regular: [], playoff: []};
        return Team.getSeasonalStatsBreakdown(team, relevantGames);
    }, [selectedSeason, relevantGames, regularGames, playoffGames, team]);

    const regularTeamStats = useMemo(() => Team.getTeamStats(team, regularGames) as TeamStatsData, [team, regularGames]);
    const playoffTeamStats = useMemo(() => Team.getTeamStats(team, playoffGames) as TeamStatsData, [team, playoffGames]);

    const handleDiscard = () => {
        setIsEditing(false);
        setErrors({});
    };

    const handleEdit = () => setIsEditing(true);

    const handleSave = async (data: TeamFormData) => {
        try {
            const nameError = await TeamService.isNameTaken(data.name, team.id) ? "Team name is already taken" : null;
            if (nameError) {
                setErrors(prev => ({...prev, name: nameError}));
                return;
            }

            if (data.logoFile) {
                const fileNameError = await Team.validateLogoFileName(data.logoFile.name, team.logo);
                if (fileNameError) {
                    setErrors(prev => ({...prev, logo: fileNameError}));
                    return;
                }
            }

            const championshipsError = Team.validateChampionships(data.championships);
            if (championshipsError) {
                setErrors(prev => ({...prev, championships: championshipsError}));
                return;
            }

            let logoUrl = team.logo;
            if (data.logoFile) {
                if (team.logo) await TeamService.deleteLogo(team.logo);
                logoUrl = await TeamService.uploadLogo(data.logoFile);
            }

            const updatedTeam = new Team({...team, ...data, logo: logoUrl});
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

    const getRosterStats = (type: 'regular' | 'playoff') => {
        const sorted = Player.sort(
            filteredPlayers,
            new Map(filteredPlayers.map(p => [p.id, playerStatsCache.get(p.id)?.[type]])),
            playerSortField,
            playerSortDirection
        );
        return sorted.map(p => ({
            id: p.id,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            stats: (playerStatsCache.get(p.id)?.[type] || {}) as PlayerStatsData
        }));
    };

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
                    {errors.general && <span>{errors.general}</span>}
                    <TeamForm
                        initialData={team}
                        onSubmit={handleSave}
                        onCancel={handleDiscard}
                        submitLabel="Save Changes"
                        errors={errors}
                        setErrors={setErrors}
                    />
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
                            <PlayerStatsTable
                                title="Regular Season Players Stats"
                                variant="roster"
                                players={getRosterStats('regular')}
                                sortConfig={{field: playerSortField, direction: playerSortDirection}}
                                onSort={(field) => handlePlayerSort(field as PlayerSortField)}
                                onView={(id) => {
                                    const player = filteredPlayers.find(p => p.id === id);
                                    if (player) navigate(`/${HANDLE_PLAYERS}/${player.id}`, {state: {player, games}});
                                }}
                            />

                            <PlayerStatsTable
                                title="Playoff Players Stats"
                                variant="roster"
                                players={getRosterStats('playoff')}
                                sortConfig={{field: playerSortField, direction: playerSortDirection}}
                                onSort={(field) => handlePlayerSort(field as PlayerSortField)}
                                onView={(id) => {
                                    const player = filteredPlayers.find(p => p.id === id);
                                    if (player) navigate(`/${HANDLE_PLAYERS}/${player.id}`, {state: {player, games}});
                                }}
                            />
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
                <SavedGamesPage2
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