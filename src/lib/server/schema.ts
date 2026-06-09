import { type InferSelectModel, type InferInsertModel, sql } from 'drizzle-orm';

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players_table = sqliteTable('players', {
	id: integer().primaryKey(),
	name: text().notNull(),
	active: integer({ mode: 'boolean' }).notNull(),
	photoDataUrl: text('photoDataUrl'),
	createdAt: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`),
	lastSeenAt: text()
		.notNull()
		.default(sql`(CURRENT_TIMESTAMP)`)
	// user: text('user')
	// 	.notNull()
	// 	.references(() => users_table.email, { onDelete: 'cascade' })
});

export type Player = InferSelectModel<typeof players_table>;
export type NewPlayer = InferInsertModel<typeof players_table>;
