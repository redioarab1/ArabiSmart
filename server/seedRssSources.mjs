import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedRssSources() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  // Read RSS sources from JSON file
  const sourcesPath = join(__dirname, "rssSources.json");
  const sourcesData = JSON.parse(readFileSync(sourcesPath, "utf-8"));

  console.log(`📡 Seeding ${sourcesData.length} RSS sources...`);

  for (const source of sourcesData) {
    try {
      await connection.execute(
        `INSERT INTO rssSources (name, url, category, language, isActive) 
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         category = VALUES(category),
         language = VALUES(language)`,
        [source.name, source.url, source.category, source.language]
      );
      
      console.log(`✅ Added: ${source.name}`);
    } catch (error) {
      console.error(`❌ Error adding ${source.name}:`, error.message);
    }
  }

  await connection.end();
  console.log("✨ RSS sources seeding completed!");
  process.exit(0);
}

seedRssSources();
