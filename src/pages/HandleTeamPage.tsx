import React, {useMemo} from 'react';
import {LoaderFunctionArgs, useLoaderData, useLocation, useNavigate} from "react-router-dom";
import {Team} from "../OOP/classes/Team";
import {GameService} from "../OOP/services/GameService";
import {Game} from "../OOP/classes/Game";
import SavedGamesPage from "./SavedGamesPage";
import {Player} from "../OOP/classes/Player";
import {Position} from "../OOP/enums/Position";
import Button from "../components/Button";
import {ActionType} from "../OOP/enums/ActionType";
import {useFilter} from "../hooks/useFilter";
import Select from "../components/Select";
import {Season} from "../OOP/enums/Season";
import {Championship} from "../OOP/enums/Championship";
import {GameType} from "../OOP/enums/GameType";
import {HANDLE_PLAYERS} from "../OOP/constants/NavigationNames";
import HandleTeamStatsTable, {HandleTeamStatsData} from "../components/tables/HandleTeamStatsTable";
import HandlePlayerStatsTable, {HandlePlayerStatsData} from "../components/tables/HandlePlayerStatsTable";
import styles from "./HandleTeamPage.module.css";

const HandleTeamPage = () => {
    const navigate = useNavigate();
    const location = useLocation()
    // these are the team's games, not all games.
    const games = useLoaderData() as Game[]
    const team = location.state.team as Team;

    const {filters, handleFilterChange} = useFilter({
        season: "",
        championship: "",
        gameType: ""
    });

    const filteredGames = useMemo(() => {
        return games.filter(game => {
            if (filters.season && game.season !== filters.season) return false;
            if (filters.championship && game.championship !== filters.championship) return false;
            if (filters.gameType && game.type !== filters.gameType) return false;
            return true;
        });
    }, [games, filters]);

    const teamStats: HandleTeamStatsData = useMemo(() => {
        let gp = 0;
        let w = 0;
        let otw = 0;
        let l = 0;
        let otl = 0;
        let gf = 0;
        let ga = 0;
        let gd = 0;
        let s = 0;
        let h = 0;
        let t = 0;

        filteredGames.forEach(game => {
            gp++
            // if we find 1 action that was in regular(OT/SO) or playoff(OT1-5), stop => isOvertime
            const isOvertime = game.actions.some(action => action.period > 3);
            const isHome = game.teams.home.id === team.id;
            if (isHome) {
                if (game.score.home.goals > game.score.away.goals) {
                    if (isOvertime) {
                        otw++
                    } else {
                        w++
                    }
                } else {
                    if (isOvertime) {
                        otl++
                    } else {
                        l++
                    }
                }

                gf += game.score.home.goals
                ga += game.score.away.goals
                gd += gf - ga
                s += game.score.home.shots
                h += game.score.home.hits
                t += game.score.home.turnovers
            } else {
                if (game.score.away.goals > game.score.home.goals) {
                    if (isOvertime) {
                        otw++
                    } else {
                        w++
                    }
                } else {
                    if (isOvertime) {
                        otl++
                    } else {
                        l++
                    }
                }

                gf += game.score.away.goals
                ga += game.score.home.goals
                gd += gf - ga
                s += game.score.away.shots
                h += game.score.away.hits
                t += game.score.away.turnovers
            }
        })
        return {gp, w, otw, l, otl, gf, ga, gd, s, h, t};
    }, [filteredGames, team.id]);

    const playerStats: HandlePlayerStatsData[] = useMemo(() => {
        const stats: HandlePlayerStatsData[] = []

        team.players.forEach(player => {
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
            stats.push({
                player,
                id: player.id,
                name: player.name,
                jerseyNumber: player.jerseyNumber,
                position: player.position,
                gp, g, a, p, s, h, t
            })
        })
        return stats;
    }, [filteredGames, team]);

    const seasonOptions = [
        {value: "", label: "All Seasons"},
        ...Object.values(Season).map(s => ({value: s, label: s}))
    ];
    const championshipOptions = [
        {value: "", label: "All Championships"},
        ...Object.values(Championship).map(c => ({value: c, label: c}))
    ];
    const gameTypeOptions = [
        {value: "", label: "All Game Types"},
        ...Object.values(GameType).map(gt => ({value: gt, label: gt}))
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <img src={team.logo} alt={team.name} className={styles.logo}/>
                <h1 className={styles.title}>{team.name}</h1>
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
                    id="championship"
                    label="Championship"
                    value={filters.championship}
                    onChange={(e) => handleFilterChange("championship", e.target.value)}
                    options={championshipOptions}
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
                <h2 className={styles.sectionTitle}>Team Statistics</h2>
                <HandleTeamStatsTable stats={teamStats}/>
            </div>

            <div>
                <h2 className={styles.sectionTitle}>Player Statistics</h2>
                <HandlePlayerStatsTable
                    players={playerStats}
                    onView={(playerStat) => navigate(`/${HANDLE_PLAYERS}/${playerStat.id}`, {
                        state: {
                            player: playerStat.player,
                            games
                        }
                    })}
                />
            </div>

            <div>
                <h2 className={styles.sectionTitle}>Game History</h2>
                <SavedGamesPage playerGames={filteredGames}/>
            </div>

            <div className={styles.footer}>
                <Button styleType={"negative"} onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        </div>
    );
};

export default HandleTeamPage;

export const loader = async ({params}: LoaderFunctionArgs): Promise<Game[]> => {
    if (!params.id) {
        throw new Error("Team ID is required");
    }
    return await GameService.getGamesByTeamId(params.id);
}