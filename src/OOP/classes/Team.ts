// OOP/classes/Team.ts
import {ITeam} from "../interfaces/ITeam";
import {Championship} from "../enums/Championship";
import {IPlayer} from "../interfaces/IPlayer";
import {getDownloadURL, ref} from "firebase/storage";
import {storage} from "../../firebase";

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
}