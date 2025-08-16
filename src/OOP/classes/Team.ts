// OOP/classes/Team.ts
import {ITeam} from "../interfaces/ITeam";
import {Championship} from "../enums/Championship";
import {IPlayer} from "../interfaces/IPlayer";
import {TeamService} from "../services/TeamService";

export class Team implements ITeam {
    id: string;
    name: string;
    logo: string;
    championships: Championship[];
    homeColor: { primary: string; secondary: string };
    awayColor: { primary: string; secondary: string };
    players: IPlayer[];
    roster?: IPlayer[];

    constructor(data: Partial<ITeam>) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.logo = data.logo || '';
        this.championships = data.championships || [];
        this.homeColor = data.homeColor || {primary: '', secondary: ''};
        this.awayColor = data.awayColor || {primary: '', secondary: ''};
        this.players = data.players || [];
        this.roster = data.roster;
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
        };
    }

    static validateName(name: string, existingTeams: ITeam[]): string | null {
        if (!name.trim()) return "Team name cannot be empty";
        if (name.length > 200) return "Team name cannot exceed 200 characters";
        if (existingTeams.some(team => team.name.toLowerCase() === name.toLowerCase())) {
            return "Team name is already taken";
        }
        return null;
    }

    static async validateLogo(logo: string): Promise<string | null> {
        if (!logo) return "Logo is required";
        const logoExists = await TeamService.checkLogoExists(logo, true);
        if (logoExists) return "Logo is already taken";
        // Note: For file size validation, we need to handle that in the component
        // as it requires file object access which shouldn't be in this class
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
}