import { type InferSelectModel, type InferInsertModel, sql } from 'drizzle-orm';

import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

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

export const games_table = sqliteTable(
	'games',
	{
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
	},
	(table) => [index('game_type_idx').on(table.game_type)]
);

export type Game = InferSelectModel<typeof games_table>;
export type NewGame = InferInsertModel<typeof games_table>;
