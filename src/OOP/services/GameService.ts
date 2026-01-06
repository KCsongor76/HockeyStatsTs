import {collection, deleteDoc, doc, getDocs, query, setDoc, where, or} from "firebase/firestore";
import {db} from "../../firebase";
import {IGame} from "../interfaces/IGame";
import {Game} from "../classes/Game";

export class GameService {
    private static collectionRef = collection(db, 'games');

    static saveGame = async (game: IGame): Promise<Game> => {
        const docRef = doc(this.collectionRef);
        const gameWithId = {...game, id: docRef.id};
        await setDoc(docRef, gameWithId);
        return new Game(gameWithId);
    }

    static getAllGames = async (): Promise<Game[]> => {
        const querySnapshot = await getDocs(this.collectionRef);
        return querySnapshot.docs.map(doc =>
            new Game({id: doc.id, ...doc.data()} as IGame)
        );
    }

    static getGamesByTeamId = async (teamId: string): Promise<Game[]> => {
        if (!teamId) throw new Error("Team ID is required");

        // Query checks if teamId matches either home or away nested ID
        const q = query(
            this.collectionRef,
            or(
                where('teams.home.id', '==', teamId),
                where('teams.away.id', '==', teamId)
            )
        );

        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc =>
            new Game({id: doc.id, ...doc.data()} as IGame)
        );
    }

    static deleteGame = async (game: IGame) => {
        if (!game.id) return;
        const docRef = doc(this.collectionRef, game.id);
        await deleteDoc(docRef);
    }

    static updateGame = async (game: IGame): Promise<Game> => {
        if (!game.id) {
            throw new Error("Cannot update game without an ID");
        }

        const docRef = doc(this.collectionRef, game.id);
        const updatedData = {
            ...game,
            timestamp: new Date().toISOString()
        };

        await setDoc(docRef, updatedData, {merge: true});

        return new Game(updatedData);
    }
}