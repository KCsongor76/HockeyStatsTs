import {ITeam} from "../interfaces/ITeam";
import {Championship} from "../enums/Championship";
import {IPlayer} from "../interfaces/IPlayer";
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "../../firebase";
import {IGame} from "../interfaces/IGame";
import {GameType} from "../enums/GameType";
import {PlayoffPeriod, RegularPeriod} from "../enums/Period";
import {Position} from "../enums/Position";

export class Team implements ITeam {
    id: string;
    name: string;
    logo: string;
    championships: Championship[];
    homeColor: { primary: string; secondary: string };
    awayColor: { primary: string; secondary: string };
    players: IPlayer[];
    roster: IPlayer[];

    constructor(data: Partial<ITeam>) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.logo = data.logo || '';
        this.championships = data.championships || [];
        this.homeColor = data.homeColor || {primary: '', secondary: ''};
        this.awayColor = data.awayColor || {primary: '', secondary: ''};
        this.players = data.players || [];
        this.roster = data.roster || [];
    }

    toPlainObject(): ITeam {
        return {
            id: this.id,
            name: this.name,
            logo: this.logo,
            homeColor: this.homeColor,
            awayColor: this.awayColor,
            championships: this.championships,
            players: this.players,
            roster: this.roster,
        };
    }

    getRosterCounts() {
        return {
            forwards: this.roster.filter(p => p.position === Position.FORWARD).length,
            defenders: this.roster.filter(p => p.position === Position.DEFENDER).length,
            goalies: this.roster.filter(p => p.position === Position.GOALIE).length
        };
    }

    validateRoster(rules: { minSkaters: number, maxSkaters: number, goalies: number }): string | null {
        const counts = this.getRosterCounts();
        const totalSkaters = counts.defenders + counts.forwards;

        if (counts.goalies !== rules.goalies) {
            return `Team must have exactly ${rules.goalies} goalies!`; // Message can be generic or passed in
        }
        if (totalSkaters < rules.minSkaters) {
            return `Team must have at least ${rules.minSkaters} skaters`;
        }
        if (totalSkaters > rules.maxSkaters) {
            return `Team must have at most ${rules.maxSkaters} skaters`;
        }
        return null;
    }

    getAvailablePlayers(): IPlayer[] {
        const rosterIds = new Set(this.roster.map(p => p.id));
        return this.players.filter(p => !rosterIds.has(p.id));
    }

    static validateName(name: string, existingTeams: ITeam[]): string | null {
        if (!name.trim()) return "Team name cannot be empty";
        if (name.length > 200) return "Team name cannot exceed 200 characters";
        if (existingTeams.some(team => team.name.toLowerCase() === name.toLowerCase())) {
            return "Team name is already taken";
        }
        return null;
    }

    static validateColors(homeColor: { primary: string, secondary: string }, awayColor: {
        primary: string,
        secondary: string
    }): string | null {
        if (!homeColor.primary || !homeColor.secondary) return "Home colors are required";
        if (!awayColor.primary || !awayColor.secondary) return "Away colors are required";
        if (homeColor.primary === homeColor.secondary) return "Home primary and secondary colors must be different";
        if (awayColor.primary === awayColor.secondary) return "Away primary and secondary colors must be different";
        return null;
    }

    static validateChampionships(championships: Championship[]): string | null {
        if (championships.length === 0) return "At least one championship must be selected";
        return null;
    }

    static checkLogoExists = async (fileName: string, isTeamCreation: boolean = false): Promise<boolean> => {
        const logoRef = ref(storage, `team-logos/${fileName}`);
        try {
            await getDownloadURL(logoRef);
            return true;
        } catch (error) {
            if (!isTeamCreation) {
                console.error("Error deleting logo:", error);
            }
            return false;
        }
    };

    static validateLogoFile(file: File): string | null {
        const allowedTypes = ['image/jpeg', 'image/png'];

        if (!allowedTypes.includes(file.type)) {
            return 'Only .jpg and .png formats are allowed';
        }

        if (file.size > 2 * 1024 * 1024) {
            return "Logo must be less than 2MB";
        }

        return null;
    }

    static getFileNameFromLogoUrl(logoUrl: string): string | null {
        if (!logoUrl) return null;
        try {
            const url = new URL(logoUrl);
            const pathParts = url.pathname.split('/');
            const encodedFileName = pathParts[pathParts.length - 1];
            return decodeURIComponent(encodedFileName.split('?')[0]);
        } catch (error) {
            console.error('Error parsing logo URL:', error);
            return null;
        }
    }

    static async validateLogoFileName(fileName: string, currentLogoUrl?: string): Promise<string | null> {
        if (currentLogoUrl) {
            const currentFileName = this.getFileNameFromLogoUrl(currentLogoUrl);
            if (currentFileName && `team-logos/${fileName}` === currentFileName) {
                return 'Please choose a different file name';
            }
        }

        const exists = await this.checkLogoExists(fileName);
        return exists ? "Logo file name is already taken" : null;
    }

    static getTeamStats = (team: ITeam, games: IGame[]) => {
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

    static getParticipatingPlayers(
        teamId: string,
        games: IGame[],
        currentRoster: IPlayer[] = []
    ): IPlayer[] {
        const uniquePlayers = new Map<string, IPlayer>();

        // 1. Add players from games
        games.forEach(game => {
            const roster = game.teams.home.id === teamId
                ? game.teams.home.roster
                : (game.teams.away.id === teamId ? game.teams.away.roster : []);

            roster?.forEach(p => {
                if (!uniquePlayers.has(p.id)) uniquePlayers.set(p.id, p);
            });
        });

        // 2. Add current roster (if filters allow or if needed as fallback)
        currentRoster.forEach(p => {
            if (!uniquePlayers.has(p.id)) uniquePlayers.set(p.id, p);
        });

        return Array.from(uniquePlayers.values());
    }
}