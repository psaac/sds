import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { env } from '$env/dynamic/private';

export const db = drizzle(env.DB_FILE_NAME ?? '');

migrate(db, { migrationsFolder: './drizzle' });
