import { type InferSelectModel, type InferInsertModel, sql } from 'drizzle-orm';

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players_table = sqliteTable('players', {
	id: integer().primaryKey(),
	name: text().notNull(),
	active: integer({ mode: 'boolean' }).notNull(),
	photoPath: text('photoPath'),
	createdAt: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	lastSeenAt: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
});

export type Player = InferSelectModel<typeof players_table>;
export type NewPlayer = InferInsertModel<typeof players_table>;

export const games_drafts_table = sqliteTable('games_drafts', {
	game_type: text({ length: 20 }).primaryKey(),
	payload_json: text().notNull(),
	updated_at: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
});

export type GameDraft = InferSelectModel<typeof games_drafts_table>;
export type NewGameDraft = InferInsertModel<typeof games_drafts_table>;

export const app_settings_table = sqliteTable('app_settings', {
	key: text().primaryKey(),
	value_json: text().notNull(),
	updated_at: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
});

export type AppSetting = InferSelectModel<typeof app_settings_table>;
export type NewAppSetting = InferInsertModel<typeof app_settings_table>;

// CREATE TABLE IF NOT EXISTS games (
//       id TEXT PRIMARY KEY,
//       game_type TEXT NOT NULL,
//       started_at TEXT NOT NULL,
//       ended_at TEXT NOT NULL,
//       winner_player_id TEXT,
//       winner_name TEXT,
//       players_json TEXT NOT NULL,
//       config_json TEXT,
//       metadata_json TEXT,
//       created_at TEXT NOT NULL
//     );

export const games_table = sqliteTable('games', {
	id: integer().primaryKey(),
	game_type: text({ length: 20 }).notNull(),
	started_at: text().notNull(),
	ended_at: text().notNull(),
	winner_player_id: integer().references(() => players_table.id),
	winner_name: text(),
	players_json: text().notNull(),
	config_json: text(),
	metadata_json: text(),
	created_at: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
});

export type Game = InferSelectModel<typeof games_table>;
export type NewGame = InferInsertModel<typeof games_table>;
