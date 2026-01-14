import { supabase } from "../../supabase";
import { IGame } from "../interfaces/IGame";
import { Game } from "../classes/Game";
import { v4 as uuidv4 } from 'uuid';

export class GameService {

    static saveGame = async (game: IGame): Promise<Game> => {
        const newId = uuidv4();
        const gameWithId = { ...game, id: newId };

        const { error } = await supabase.from('games').insert({
            id: newId,
            timestamp: new Date().toISOString(),
            home_team_id: game.teams.home.id,
            away_team_id: game.teams.away.id,
            data: gameWithId
        });

        if (error) throw error;
        return new Game(gameWithId);
    }

    static getAllGames = async (): Promise<Game[]> => {
        const { data, error } = await supabase
            .from('games')
            .select('data');

        if (error) throw error;

        return data.map((row: any) => new Game(row.data as IGame));
    }

    static getGamesByTeamId = async (teamId: string): Promise<Game[]> => {
        if (!teamId) throw new Error("Team ID is required");

        // Use the explicit columns for fast filtering
        const { data, error } = await supabase
            .from('games')
            .select('data')
            .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

        if (error) throw error;

        return data.map((row: any) => new Game(row.data as IGame));
    }

    static deleteGame = async (game: IGame) => {
        if (!game.id) return;

        const { error } = await supabase
            .from('games')
            .delete()
            .eq('id', game.id);

        if (error) throw error;
    }

    static updateGame = async (game: IGame): Promise<Game> => {
        if (!game.id) {
            throw new Error("Cannot update game without an ID");
        }

        const updatedData = {
            ...game,
            timestamp: new Date().toISOString()
        };

        const { error } = await supabase
            .from('games')
            .update({
                timestamp: updatedData.timestamp,
                home_team_id: updatedData.teams.home.id,
                away_team_id: updatedData.teams.away.id,
                data: updatedData
            })
            .eq('id', game.id);

        if (error) throw error;

        return new Game(updatedData);
    }
}