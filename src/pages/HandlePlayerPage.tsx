import React, {useEffect, useMemo, useState} from 'react';
import {Game} from "../OOP/classes/Game";
import {Team} from "../OOP/classes/Team";
import {useLoaderData, useLocation, useNavigate} from "react-router-dom";
import {TeamService} from "../OOP/services/TeamService";
import {Player} from "../OOP/classes/Player";
import Button from "../components/Button";
import {TRANSFER} from "../OOP/constants/NavigationNames";
import {Position} from "../OOP/enums/Position";
import {ActionType} from "../OOP/enums/ActionType";
import {useFilter} from "../hooks/useFilter";
import Select from "../components/Select";
import {Season} from "../OOP/enums/Season";
import {GameType} from "../OOP/enums/GameType";
import SavedGamesPage from "./SavedGamesPage";
import HandlePlayerStatsTable, {HandlePlayerStatsData} from "../components/tables/HandlePlayerStatsTable";
import styles from "./HandlePlayerPage.module.css";

const HandlePlayerPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const player = location.state.player as Player;
    const games = location.state.games as Game[];

    const teams = useLoaderData() as Team[];
    const filteredTeamArray = teams.filter(team => team.id === player.teamId)
    const team = filteredTeamArray[0];

    const {filters, handleFilterChange} = useFilter({
        season: "",
        team: "",
        gameType: ""
    });

    const availableTeams = useMemo(() => {
        const teamIds = new Set<string>();
        const available: Team[] = [];
        games.forEach(g => {
            if (filters.season && g.season !== filters.season) return;
            if (filters.gameType && g.type !== filters.gameType) return;

            const homeRoster = g.teams.home.roster || [];
            const awayRoster = g.teams.away.roster || [];

            if (homeRoster.some(p => p.id === player.id)) {
                if (!teamIds.has(g.teams.home.id)) {
                    teamIds.add(g.teams.home.id);
                    const t = teams.find(t => t.id === g.teams.home.id);
                    if (t) available.push(t);
                }
            }
            if (awayRoster.some(p => p.id === player.id)) {
                if (!teamIds.has(g.teams.away.id)) {
                    teamIds.add(g.teams.away.id);
                    const t = teams.find(t => t.id === g.teams.away.id);
                    if (t) available.push(t);
                }
            }
        });
        return available;
    }, [games, teams, filters.season, filters.gameType, player.id]);

    const filteredGames = useMemo(() => {
        return games.filter(game => {
            if (filters.season && game.season !== filters.season) return false;
            if (filters.gameType && game.type !== filters.gameType) return false;
            if (filters.team && game.teams.home.id !== filters.team && game.teams.away.id !== filters.team) return false;

            const homeRoster = game.teams.home.roster || [];
            const awayRoster = game.teams.away.roster || [];
            return homeRoster.some(p => p.id === player.id) || awayRoster.some(p => p.id === player.id);
        });
    }, [games, filters, player.id]);

    const playerStats: HandlePlayerStatsData[] = useMemo(() => {
        let gp = 0;
        let g = 0;
        let a = 0;
        let p = 0;
        let s = 0;
        let h = 0;
        let t = 0;

        filteredGames.forEach(game => {
            const homeRoster = game.teams.home.roster || [];
            const awayRoster = game.teams.away.roster || [];
            const isPlaying = homeRoster.some(p => p.id === player.id) || awayRoster.some(p => p.id === player.id);

            if (isPlaying) {
                gp++;
                game.actions.forEach(action => {
                    if (action.player.id === player.id) {
                        if (action.type === ActionType.GOAL) {
                            g++;
                            s++;
                        } else if (action.type === ActionType.SHOT) {
                            s++;
                        } else if (action.type === ActionType.HIT) {
                            h++;
                        } else if (action.type === ActionType.TURNOVER) {
                            t++;
                        }
                    }
                    if (action.type === ActionType.GOAL && action.assists) {
                        if (action.assists.some(assist => assist.id === player.id)) {
                            a++;
                        }
                    }
                })
            }
        })
        p = g + a;

        return [{
            id: player.id,
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            position: player.position,
            gp, g, a, p, s, h, t
        }];
    }, [filteredGames, player]);

    const seasonOptions = [
        {value: "", label: "All Seasons"},
        ...Object.values(Season).map(s => ({value: s, label: s}))
    ];
    const teamOptions = [
        {value: "", label: "All Teams"},
        ...availableTeams.map(t => ({value: t.id, label: t.name}))
    ];
    const gameTypeOptions = [
        {value: "", label: "All Game Types"},
        ...Object.values(GameType).map(gt => ({value: gt, label: gt}))
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Player Details</h1>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Name</span>
                        <span className={styles.infoValue}>{player.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Current Team</span>
                        <span className={styles.infoValue}>{team.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Position</span>
                        <span className={styles.infoValue}>{player.position}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Jersey Number</span>
                        <span className={styles.infoValue}>#{player.jerseyNumber}</span>
                    </div>
                </div>
            </div>

            <div className={styles.filtersSection}>
                <Select
                    id="season"
                    label="Season"
                    value={filters.season}
                    onChange={(e) => handleFilterChange("season", e.target.value)}
                    options={seasonOptions}
                />
                <Select
                    id="team"
                    label="Team"
                    value={filters.team}
                    onChange={(e) => handleFilterChange("team", e.target.value)}
                    options={teamOptions}
                />
                <Select
                    id="gameType"
                    label="Game Type"
                    value={filters.gameType}
                    onChange={(e) => handleFilterChange("gameType", e.target.value)}
                    options={gameTypeOptions}
                />
            </div>

            <div>
                <h2 className={styles.sectionTitle}>Statistics</h2>
                <HandlePlayerStatsTable players={playerStats}/>
            </div>

            <div>
                <h2 className={styles.sectionTitle}>Game History</h2>
                <SavedGamesPage playerGames={filteredGames}/>
            </div>

            <div className={styles.footer}>
                <Button
                    styleType={"positive"}
                    type="button"
                    onClick={() => navigate(`../${TRANSFER}/${player.id}`, {state: {player, team}})}
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

export const loader = async () => {
    return await TeamService.getAllTeams();
}