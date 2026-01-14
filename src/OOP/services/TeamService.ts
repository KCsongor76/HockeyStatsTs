import { supabase } from "../../supabase";
import { TeamAlreadyExistsError } from "../errors/TeamAlreadyExistsError";
import { IPlayer } from "../interfaces/IPlayer";
import { ITeam } from "../interfaces/ITeam";
import { Team } from "../classes/Team";
import { PlayerService } from "./PlayerService";
import { GameService } from "./GameService";
import { v4 as uuidv4 } from 'uuid';
import { Position } from "../enums/Position";

export class TeamService {

    static createTeam = async (team: Partial<ITeam>) => {
        const { data: existing } = await supabase
            .from('teams')
            .select('id')
            .eq('name', team.name)
            .single();

        if (existing) {
            throw new TeamAlreadyExistsError(`Team "${team.name}" already exists`);
        }

        const newId = uuidv4();

        const { error } = await supabase.from('teams').insert({
            id: newId,
            name: team.name,
            logo: team.logo || '',
            home_color: team.homeColor,
            away_color: team.awayColor,
            championships: team.championships || []
        });

        if (error) throw error;
    }

    static getTeamById = async (id: string): Promise<ITeam | null> => {
        const { data: teamData, error } = await supabase
            .from('teams')
            .select(`
                *,
                players (*)
            `)
            .eq('id', id)
            .single();

        if (error || !teamData) return null;

        return {
            id: teamData.id,
            name: teamData.name,
            logo: teamData.logo,
            homeColor: teamData.home_color,
            awayColor: teamData.away_color,
            championships: teamData.championships,
            players: teamData.players.map((p: any) => ({
                id: p.id,
                teamId: p.team_id,
                name: p.name,
                jerseyNumber: p.jersey_number,
                position: p.position as Position
            } as IPlayer))
        } as ITeam;
    }

    static updateTeam = async (id: string, team: Team) => {
        const plainTeam = team.toPlainObject();

        const { error } = await supabase.from('teams').update({
            name: plainTeam.name,
            logo: plainTeam.logo,
            home_color: plainTeam.homeColor,
            away_color: plainTeam.awayColor,
            championships: plainTeam.championships
        }).eq('id', id);

        if (error) throw error;
    }

    static deleteTeam = async (id: string) => {
        await this.createFreeAgentTeamIfNotExists();

        const players = await PlayerService.getPlayersByTeam(id);
        const transferPromises = players.map(player =>
            PlayerService.transferPlayer(id, "free-agent", player)
        );
        await Promise.all(transferPromises);

        const teamGames = await GameService.getGamesByTeamId(id);
        const hasGames = teamGames.length > 0;

        const { data: teamData } = await supabase
            .from('teams')
            .select('logo')
            .eq('id', id)
            .single();

        if (teamData?.logo && !hasGames) {
            try {
                await this.deleteLogo(teamData.logo);
            } catch (error) {
                console.error("Error deleting team logo:", error);
            }
        }

        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) throw error;
    }

    static getAllTeams = async (): Promise<Team[]> => {
        const { data, error } = await supabase
            .from('teams')
            .select(`
                *,
                players (*)
            `)
            .order('name', { ascending: true });

        if (error) throw error;

        return data.map((t: any) => {
            const mappedPlayers = (t.players || []).map((p: any) => ({
                id: p.id,
                teamId: p.team_id,
                name: p.name,
                jerseyNumber: p.jersey_number,
                position: p.position as Position
            } as IPlayer));

            mappedPlayers.sort((a: IPlayer, b: IPlayer) => {
                const positionOrder: Record<string, number> = {'Goalie': 0, 'Defender': 1, 'Forward': 2};
                const aOrder = positionOrder[a.position] ?? 3;
                const bOrder = positionOrder[b.position] ?? 3;
                return aOrder !== bOrder ? aOrder - bOrder : a.name.localeCompare(b.name);
            });

            return new Team({
                id: t.id,
                name: t.name,
                logo: t.logo,
                homeColor: t.home_color,
                awayColor: t.away_color,
                championships: t.championships,
                players: mappedPlayers
            });
        });
    }

    static uploadLogo = async (logo: File) => {
        const fileExt = logo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('team-logos')
            .upload(filePath, logo);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('team-logos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    static deleteLogo = async (logoUrl: string) => {
        if (!logoUrl) return;
        const urlParts = logoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];

        const { error } = await supabase.storage
            .from('team-logos')
            .remove([fileName]);

        if (error) {
            console.error("Error deleting logo:", error);
            throw error;
        }
    };

    static createFreeAgentTeamIfNotExists = async () => {
        const freeAgentId = "free-agent";
        const { data } = await supabase
            .from('teams')
            .select('id')
            .eq('id', freeAgentId)
            .single();

        if (!data) {
            await supabase.from('teams').insert({
                id: freeAgentId,
                name: "Free Agents",
                logo: "",
                home_color: {primary: "#CCCCCC", secondary: "#FFFFFF"},
                away_color: {primary: "#FFFFFF", secondary: "#CCCCCC"},
                championships: []
            });
        }
    }

    static isNameTaken = async (name: string, excludeId?: string): Promise<boolean> => {
        let query = supabase
            .from('teams')
            .select('id')
            .eq('name', name);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data } = await query;
        return data ? data.length > 0 : false;
    }
}