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
import PlayerTable from "../components/PlayerTable";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";

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
            <p>Name: {player.name}</p>
            <p>Current team: {team?.name}</p>
            <p>Position: {player.position}</p>
            <p>Jersey number: {player.jerseyNumber}</p>

            {isEditing ? (
                <>
                    <Input
                        label="Name:"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Input
                        label="Jersey number:"
                        type="number"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(Number(e.target.value))}
                    />

                    <Select
                        label="Position:"
                        value={position}
                        onChange={(e) => setPosition(e.target.value as Position)}
                        options={Object.values(Position).map(position => ({
                            value: position,
                            label: position
                        }))}
                    />

                    {error && <p style={{color: 'red'}}>{error}</p>}
                    <Button styleType={"positive"} type="button" onClick={saveHandler}>Save Changes</Button>
                    <Button styleType={"negative"} type="button" onClick={() => setIsEditing(false)}>Discard Changes</Button>
                </>
            ) : <Button styleType={"neutral"} type="button" onClick={() => setIsEditing(true)}>Edit player</Button>}

            <Select
                label="Season:"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value as Season)}
                options={[
                    { value: "", label: "All Seasons" },
                    ...Object.values(Season).map(season => ({
                        value: season,
                        label: season
                    }))
                ]}
            />

            {availableTeams.length > 1 && (
                <Select
                    label="Team:"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    options={[
                        { value: "", label: "All Teams" },
                        ...availableTeams.map(team => ({
                            value: team.id,
                            label: team.name
                        }))
                    ]}
                />
            )}

            <div>
                <h3>Regular Season Players Stats</h3>
                <PlayerTable pageType="player" player={player} games={filteredGamesRegular}/>
            </div>

            <div>
                <h3>Playoff Players Stats</h3>
                <PlayerTable pageType="player" player={player} games={filteredGamesPlayoff}/>
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

            <Button
                styleType={"positive"}
                type="button"
                onClick={() => navigate(`../transfer/:${player.id}`, {state: {player, team}})}
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
    );
};

export default HandlePlayerPage;