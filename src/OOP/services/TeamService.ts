import {
    collection, collectionGroup, deleteDoc, doc,
    getDoc, getDocs, query, setDoc, updateDoc, where
} from "firebase/firestore";
import {deleteObject, getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {db, storage} from "../../firebase";
import {TeamAlreadyExistsError} from "../errors/TeamAlreadyExistsError";
import {IPlayer} from "../interfaces/IPlayer";
import {ITeam} from "../interfaces/ITeam";
import {Team} from "../classes/Team";
import {PlayerService} from "./PlayerService";

export class TeamService {
    private static collectionRef = collection(db, 'teams');

    static createTeam = async (team: Partial<ITeam>) => {
        // Check for existing team name using a query (faster than fetching all)
        const q = query(this.collectionRef, where('name', '==', team.name));
        if (!(await getDocs(q)).empty) {
            throw new TeamAlreadyExistsError(`Team "${team.name}" already exists`);
        }

        // Single write operation
        const docRef = doc(this.collectionRef);
        const teamWithId = {...team, id: docRef.id};
        await setDoc(docRef, teamWithId);
    }

    static getTeamById = async (id: string): Promise<ITeam | null> => {
        const docRef = doc(this.collectionRef, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        // Get players subcollection
        const playersCollectionRef = collection(docRef, 'players');
        const playersSnapshot = await getDocs(playersCollectionRef);

        const players = playersSnapshot.docs.map(playerDoc => ({
            id: playerDoc.id,
            ...playerDoc.data()
        } as IPlayer));

        return {
            id: docSnap.id,
            ...docSnap.data(),
            players // add players to the team object
        } as ITeam;
    }

    static updateTeam = async (id: string, team: Team) => {
        const docRef = doc(this.collectionRef, id);
        // @ts-ignore
        await updateDoc(docRef, team.toPlainObject());
    }

    static deleteTeam = async (id: string) => {
        // Move players to free agent team
        const players = await PlayerService.getPlayersByTeam(id);
        const transferPromises = players.map(player =>
            PlayerService.transferPlayer(id, "free-agent", player)
        );
        await Promise.all(transferPromises);

        const teamDocRef = doc(this.collectionRef, id);

        // First get the team data to check for a logo
        const teamSnap = await getDoc(teamDocRef);
        const teamData = teamSnap.data() as ITeam | undefined;

        // Reference to the "players" subcollection
        const playersCollectionRef = collection(teamDocRef, "players");

        // Get all documents in the "players" subcollection
        const playersSnapshot = await getDocs(playersCollectionRef);

        // Delete each document in the "players" subcollection
        const deletePromises = playersSnapshot.docs.map((playerDoc) => deleteDoc(playerDoc.ref));

        // Wait for all player documents to be deleted
        await Promise.all(deletePromises);

        // Delete the team's logo if it exists
        if (teamData?.logo) {
            try {
                await this.deleteLogo(teamData.logo);
            } catch (error) {
                console.error("Error deleting team logo:", error);
                // Continue with team deletion even if logo deletion fails
            }
        }

        // Finally, delete the team document
        await deleteDoc(teamDocRef);
    }

    static getAllTeams = async (): Promise<ITeam[]> => {
        // Fetch all teams and players in parallel
        const teamsSnapshot = await getDocs(this.collectionRef);
        const teamsData = teamsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as ITeam));

        // Fetch all players using a collection group query
        const playersSnapshot = await getDocs(collectionGroup(db, 'players'));
        const playersByTeamId = playersSnapshot.docs.reduce((acc, doc) => {
            const teamId = doc.ref.parent.parent?.id;
            if (teamId) {
                if (!acc[teamId]) acc[teamId] = [];
                acc[teamId].push({id: doc.id, ...doc.data()} as IPlayer);
            }
            return acc;
        }, {} as Record<string, IPlayer[]>);

        // Merge players into teams
        const teams = teamsData.map(team => ({
            ...team,
            players: playersByTeamId[team.id]?.sort((a, b) => a.name.localeCompare(b.name)) || []
        }));

        // Sort teams alphabetically
        teams.sort((a, b) => a.name.localeCompare(b.name));
        return teams;
    }

    static uploadLogo = async (logo: File) => {
        const logoRef = ref(storage, `team-logos/${logo.name}`);
        await uploadBytes(logoRef, logo);
        return await getDownloadURL(logoRef);
    };

    static deleteLogo = async (logoUrl: string) => {
        if (!logoUrl) return;
        try {
            const storageRef = ref(storage, logoUrl);
            await deleteObject(storageRef);
        } catch (error) {
            console.error("Error deleting logo:", error);
            throw error;
        }
    };

    static createFreeAgentTeamIfNotExists = async () => {
        const freeAgentId = "free-agent";
        const freeAgentDocRef = doc(this.collectionRef, freeAgentId);
        const docSnap = await getDoc(freeAgentDocRef);

        if (!docSnap.exists()) {
            const freeAgentTeam = {
                id: freeAgentId,
                name: "Free Agents",
                logo: "",
                homeColor: {primary: "#CCCCCC", secondary: "#FFFFFF"},
                awayColor: {primary: "#FFFFFF", secondary: "#CCCCCC"},
                championships: [],
                players: []
            };
            await setDoc(freeAgentDocRef, freeAgentTeam);
        }
    }

    static isNameTaken = async (name: string, excludeId?: string): Promise<boolean> => {
        const q = query(
            this.collectionRef,
            where('name', '==', name),
            ...(excludeId ? [where('id', '!=', excludeId)] : [])
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    }
}