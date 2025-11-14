import {collection, deleteDoc, doc, getDocs, setDoc} from "firebase/firestore";
import {db} from "../../firebase";
import {IGame} from "../interfaces/IGame";

export class GameService {
    private static collectionRef = collection(db, 'games');

    static saveGame = async (game: IGame) => {
        const docRef = doc(this.collectionRef); // Generate ID upfront
        const gameWithId = {...game, id: docRef.id};
        await setDoc(docRef, gameWithId); // Single write operation
        return gameWithId as IGame;
    }

    static getAllGames = async () => {
        const querySnapshot = await getDocs(this.collectionRef);
        return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as IGame));
    }

    static deleteGame = async (game: IGame) => {
        const id = game.id;
        const docRef = doc(this.collectionRef, id);
        await deleteDoc(docRef);
    }

    static updateGame = async (game: IGame) => {
        if (!game.id) {
            throw new Error("Cannot update game without an ID");
        }

        const docRef = doc(this.collectionRef, game.id);

        // Using setDoc with merge: true will update existing fields and add new ones
        await setDoc(docRef, {
            ...game,
            timestamp: new Date().toISOString()
        }, { merge: true });

        return game;
    }
}