import { supabase } from "../../supabase";
import { IPlayer } from "../interfaces/IPlayer";
import { TeamService } from "./TeamService";
import { v4 as uuidv4 } from 'uuid';
import { Position } from "../enums/Position";

export class PlayerService {

    private static mapToPlayer(p: any): IPlayer {
        return {
            id: p.id,
            teamId: p.team_id,
            name: p.name,
            jerseyNumber: p.jersey_number,
            position: p.position as Position
        };
    }

    static getPlayersByTeam = async (teamId: string): Promise<IPlayer[]> => {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId);

        if (error) throw error;

        return data.map(this.mapToPlayer);
    }

    static getAllPlayers = async (): Promise<IPlayer[]> => {
        await TeamService.createFreeAgentTeamIfNotExists();

        const { data, error } = await supabase
            .from('players')
            .select('*');

        if (error) throw error;

        const allPlayers = data.map(this.mapToPlayer);

        allPlayers.sort((a, b) => {
            const positionOrder: Record<string, number> = {'Goalie': 0, 'Defender': 1, 'Forward': 2};
            const aOrder = positionOrder[a.position] ?? 3;
            const bOrder = positionOrder[b.position] ?? 3;
            return aOrder !== bOrder ? aOrder - bOrder : a.name.localeCompare(b.name);
        });

        return allPlayers;
    }

    static deletePlayer = async (teamId: string, playerId: string) => {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId);

        if (error) throw error;
    }

    static isJerseyNumberAvailable = async (teamId: string, jerseyNumber: number): Promise<boolean> => {
        const { data } = await supabase
            .from('players')
            .select('id')
            .eq('team_id', teamId)
            .eq('jersey_number', jerseyNumber);

        return !data || data.length === 0;
    }

    static createPlayer = async (teamId: string, player: IPlayer): Promise<void> => {
        const { error } = await supabase.from('players').insert({
            id: uuidv4(),
            team_id: teamId,
            name: player.name,
            jersey_number: player.jerseyNumber,
            position: player.position
        });

        if (error) throw error;
    }

    static updatePlayer = async (teamId: string, playerId: string, player: Partial<IPlayer>) => {
        const updateData: any = {};
        if (player.name !== undefined) updateData.name = player.name;
        if (player.jerseyNumber !== undefined) updateData.jersey_number = player.jerseyNumber;
        if (player.position !== undefined) updateData.position = player.position;

        const { error } = await supabase
            .from('players')
            .update(updateData)
            .eq('id', playerId);

        if (error) throw error;
    }

    static transferPlayer = async (fromTeamId: string, toTeamId: string, player: IPlayer) => {
        const { error } = await supabase
            .from('players')
            .update({ team_id: toTeamId })
            .eq('id', player.id);

        if (error) {
            console.error('Error transferring player:', error);
            throw new Error('Failed to transfer player');
        }
    }
}