import {addDoc, collection, collectionGroup, deleteDoc, doc, getDocs, setDoc, updateDoc} from "firebase/firestore";
import {db} from "../../firebase";
import {IPlayer} from "../interfaces/IPlayer";
import {TeamService} from "./TeamService";

export class PlayerService {
    static async getPlayersByTeam(teamId: string): Promise<IPlayer[]> {
        const playersCollectionRef = collection(db, `teams/${teamId}/players`);
        const querySnapshot = await getDocs(playersCollectionRef);
        return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as IPlayer));
    }

    static async getAllPlayers(): Promise<IPlayer[]> {
        // Single query for all players across teams
        await TeamService.createFreeAgentTeamIfNotExists();

        const playersCollectionGroup = collectionGroup(db, 'players');
        const querySnapshot = await getDocs(playersCollectionGroup);
        const allPlayers = querySnapshot.docs.map(doc => {
            const teamId = doc.ref.parent.parent?.id; // Extract teamId from path
            return {id: doc.id, teamId, ...doc.data()} as IPlayer;
        });

        // Existing sorting logic
        allPlayers.sort((a, b) => {
            const positionOrder = {'Goalie': 0, 'Defender': 1, 'Forward': 2};
            const aOrder = positionOrder[a.position as keyof typeof positionOrder] ?? 3;
            // @ts-ignore
            const bOrder = positionOrder[b.position as keyof typeof positionOrder] ?? 3;
            return aOrder !== bOrder ? aOrder - bOrder : a.name.localeCompare(b.name);
        });

        return allPlayers;
    }

    static async deletePlayer(teamId: string, playerId: string) {
        const docRef = doc(db, `teams/${teamId}/players`, playerId);
        await deleteDoc(docRef);
    }

    static async isJerseyNumberAvailable(teamId: string, jerseyNumber: number): Promise<boolean> {
        const existingPlayers = await PlayerService.getPlayersByTeam(teamId);
        return !existingPlayers.some(p => p.jerseyNumber === jerseyNumber);
    }

    static async createPlayer(teamId: string, player: IPlayer): Promise<void> {
        const docRef = doc(collection(db, `teams/${teamId}/players`)); // Generate ID
        const playerWithId = {...player, id: docRef.id, teamId}; // Include teamId
        await setDoc(docRef, playerWithId); // Single write
    }

    static async updatePlayer(teamId: string, playerId: string, player: Partial<IPlayer>) {
        const docRef = doc(db, `teams/${teamId}/players`, playerId);
        await updateDoc(docRef, player);
    }

    static transferPlayer = async (fromTeamId: string, toTeamId: string, player: IPlayer) => {
        // todo: explain: why this doesn't work with the if checks, even if all parameters given to the function are correct in usage?
        try {
            // Remove from old team
            if (fromTeamId) {
                const fromRef = doc(db, `teams/${fromTeamId}/players`, player.id);
                await deleteDoc(fromRef);
            }

            // Add to new team
            if (toTeamId) {
                const toRef = doc(db, `teams/${toTeamId}/players`, player.id);
                await setDoc(toRef, {...player, teamId: toTeamId});
            }
        } catch (error) {
            console.error('Error transferring player:', error);
            throw new Error('Failed to transfer player');
        }
    }
}