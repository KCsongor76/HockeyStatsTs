import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.REACT_APP_SUPABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

console.log("Supabase URL found:", process.env.REACT_APP_SUPABASE_URL ? "YES" : "NO");

// 1. Firebase Config
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Supabase Config
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const migrate = async () => {
    console.log("🚀 Starting Migration...");

    try {
        // --- MIGRATE TEAMS ---
        console.log("📦 Migrating Teams...");
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const teams = teamsSnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.name,
                logo: d.logo,
                home_color: d.homeColor,
                away_color: d.awayColor,
                championships: d.championships
            };
        });

        if (teams.length > 0) {
            const { error } = await supabase.from('teams').upsert(teams);
            if (error) throw error;
            console.log(`✅ Migrated ${teams.length} teams.`);
        }

        // --- MIGRATE PLAYERS ---
        console.log("📦 Migrating Players...");
        let totalPlayers = 0;

        for (const teamDoc of teamsSnapshot.docs) {
            const teamId = teamDoc.id;
            const playersSnapshot = await getDocs(collection(db, `teams/${teamId}/players`));

            const players = playersSnapshot.docs.map(pDoc => {
                const p = pDoc.data();
                return {
                    id: pDoc.id,
                    team_id: teamId,
                    name: p.name,
                    // Handle field naming differences if your Firestore had 'jerseyNumber' or 'number'
                    jersey_number: p.jerseyNumber || p.number,
                    position: p.position
                };
            });

            if (players.length > 0) {
                const { error } = await supabase.from('players').upsert(players);
                if (error) throw error;
                totalPlayers += players.length;
            }
        }
        console.log(`✅ Migrated ${totalPlayers} players.`);

        // --- MIGRATE GAMES ---
        console.log("📦 Migrating Games...");
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const games = gamesSnapshot.docs.map(doc => {
            const g = doc.data();
            const gameData = { ...g, id: doc.id };
            return {
                id: doc.id,
                timestamp: g.timestamp || new Date().toISOString(),
                home_team_id: g.teams?.home?.id,
                away_team_id: g.teams?.away?.id,
                data: gameData
            };
        });

        if (games.length > 0) {
            const { error } = await supabase.from('games').upsert(games);
            if (error) throw error;
            console.log(`✅ Migrated ${games.length} games.`);
        }

    } catch (e) {
        console.error("❌ Migration Failed:", e);
    }

    console.log("🎉 Migration Complete!");
};

migrate();