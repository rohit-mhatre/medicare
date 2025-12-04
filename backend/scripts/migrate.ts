import { pool } from '../src/server';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
    const client = await pool.connect();
    try {
        // Read all migration files
        const migrationFiles = fs.readdirSync(path.join(__dirname, '../migrations')).sort();

        for (const file of migrationFiles) {
            if (file.endsWith('.sql')) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(path.join(__dirname, '../migrations', file), 'utf8');
                try {
                    await pool.query(sql);
                } catch (error: any) {
                    if (error.code === '42P07') { // duplicate_table
                        console.log(`Skipping ${file}: Table already exists`);
                    } else {
                        throw error;
                    }
                }
            }
        }
        console.log('✓ Migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
