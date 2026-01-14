// scripts/migrate_logos.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load Environment Variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.REACT_APP_SUPABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

console.log("Supabase URL:", process.env.REACT_APP_SUPABASE_URL ? "✅ Loaded" : "❌ Missing");

// 2. Initialize Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
// Note: If you have Row Level Security (RLS) enabled on Storage,
// you might need the SERVICE_ROLE key instead of the ANON key for this script.
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'team-logos';

const migrateLogos = async () => {
    console.log("🚀 Starting Logo Migration...");

    // 3. Fetch all teams
    const { data: teams, error } = await supabase
        .from('teams')
        .select('*');

    if (error) {
        console.error("❌ Error fetching teams:", error);
        return;
    }

    console.log(`Found ${teams.length} teams. Checking for Firebase logos...`);

    let migratedCount = 0;

    for (const team of teams) {
        // Check if logo exists and is a Firebase URL
        if (team.logo && team.logo.includes('firebasestorage')) {
            console.log(`\nProcessing Team: ${team.name}`);

            try {
                // A. Download image from Firebase
                const response = await fetch(team.logo);
                if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const contentType = response.headers.get('content-type') || 'image/png';

                // Determine file extension
                const ext = contentType.split('/')[1] || 'png';
                const fileName = `${team.id}_${Date.now()}.${ext}`;

                // B. Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(fileName, buffer, {
                        contentType: contentType,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // C. Get new Public URL
                const { data: publicUrlData } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(fileName);

                const newLogoUrl = publicUrlData.publicUrl;

                // D. Update Team in Database
                const { error: updateError } = await supabase
                    .from('teams')
                    .update({ logo: newLogoUrl })
                    .eq('id', team.id);

                if (updateError) throw updateError;

                console.log(`✅ Migrated logo for ${team.name}`);
                migratedCount++;

            } catch (err) {
                console.error(`❌ Failed to migrate logo for ${team.name}:`, err);
            }
        } else {
            // console.log(`Skipping ${team.name} (No logo or already migrated)`);
        }
    }

    console.log(`\n🎉 Migration Complete! Migrated ${migratedCount} logos.`);
};

migrateLogos();