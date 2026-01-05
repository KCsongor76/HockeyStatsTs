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
import Select from "../components/Select";
import {TRANSFER} from "../OOP/constants/NavigationNames";
import {Player} from "../OOP/classes/Player";
import {Game} from "../OOP/classes/Game";
import PlayerForm, {PlayerFormData} from "../components/forms/PlayerForm";
import PlayerStatsTable, {PlayerStatsData} from "../components/tables/PlayerStatsTable";

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

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const saveHandler = async (data: PlayerFormData) => {
        if (data.name === player.name && data.position === player.position && data.jerseyNumber === player.jerseyNumber) {
            setIsEditing(false);
            setErrors({});
            return;
        }

        if (data.jerseyNumber !== player.jerseyNumber) {
            const err = Player.validateJerseyNumber(data.jerseyNumber);
            if (err) {
                setErrors(prev => ({...prev, jerseyNumber: err}));
                return;
            }
        }

        try {
            await PlayerService.updatePlayer(player.teamId, player.id, {
                name: data.name,
                position: data.position,
                jerseyNumber: data.jerseyNumber
            });
            const updatedPlayer = new Player(player.id, data.jerseyNumber, data.name, data.position, player.teamId);
            setPlayer(updatedPlayer);
            setIsEditing(false);
            setErrors({});
        } catch (error) {
            console.error("Failed to update player:", error);
            setErrors(prev => ({...prev, general: 'Failed to update player.'}));
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

    // Option mappers
    const seasonOptions = [
        {value: "All", label: "All Seasons"},
        ...Object.values(Season).map(season => ({value: season, label: season}))
    ];
    const teamFilterOptions = [
        {value: "", label: "All Teams"},
        ...availableTeams.map(team => ({value: team.id, label: team.name}))
    ];


    return (
        <>
            <h1>Player Details</h1>
            <p>Name: {player.name}</p>
            <p>Current team: {team?.name}</p>
            <p>Position: {player.position}</p>
            <p>Jersey number: {player.jerseyNumber}</p>

            {isEditing ? (
                <PlayerForm
                    initialData={player}
                    onSubmit={saveHandler}
                    onCancel={() => setIsEditing(false)}
                    submitLabel="Save Changes"
                    errors={errors}
                    setErrors={setErrors}
                />
            ) : (
                <Button styleType={"neutral"} type="button" onClick={() => setIsEditing(true)}>Edit player</Button>
            )}

            <div>
                <Select
                    id="seasonFilter"
                    label="Season:"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value as Season | 'All')}
                    options={seasonOptions}
                />

                {availableTeams.length > 1 && (
                    <Select
                        id="teamFilter"
                        label="Team:"
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        options={teamFilterOptions}
                    />
                )}
            </div>

            <PlayerStatsTable
                title="Regular Season Players Stats"
                variant="seasonal"
                totalStats={totalStats.regular}
                seasonalStats={seasonalStats.regular}
                showSeasonColumn={selectedSeason === 'All'}
            />

            <PlayerStatsTable
                title="Playoff Players Stats"
                variant="seasonal"
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
                    key={`${selectedSeason}-${selectedTeamId}-${relevantGames.length}`}
                    playerGames={relevantGames}
                    showFilters={false}
                />
            )}

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
        </>
    );
};

export default HandlePlayerPage;