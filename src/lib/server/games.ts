import { eq } from 'drizzle-orm';
import { db } from './db';
import {
	games_table,
	games_drafts_table,
	type Game,
	type NewGame,
	type GameDraft,
	type NewGameDraft
} from './schema';

export function addGame(game: NewGame): Game[] {
	return db.insert(games_table).values(game).returning().all();
}

export function getGame(id: number): Game | undefined {
	const games = db.select().from(games_table).where(eq(games_table.id, id)).all();
	return games[0];
}

export function getAllGames(): Game[] {
	return db.select().from(games_table).all();
}

// Drafts
export function saveGameDraft(gameType: string, payload: any): GameDraft {
	const payload_json = JSON.stringify(payload);
	const existingDraft = db
		.select()
		.from(games_drafts_table)
		.where(eq(games_drafts_table.game_type, gameType))
		.all()[0];
	if (existingDraft) {
		db.update(games_drafts_table)
			.set({ payload_json })
			.where(eq(games_drafts_table.game_type, gameType))
			.returning()
			.all();
		return { ...existingDraft, payload_json };
	} else {
		const newDraft: NewGameDraft = { game_type: gameType, payload_json };
		const insertedDraft = db.insert(games_drafts_table).values(newDraft).returning().all()[0];
		return insertedDraft;
	}
}

export function getGameDraft(gameType: string): GameDraft | undefined {
	const drafts = db
		.select()
		.from(games_drafts_table)
		.where(eq(games_drafts_table.game_type, gameType))
		.all();
	return drafts[0];
}

export function deleteGameDraft(gameType: string): void {
	db.delete(games_drafts_table).where(eq(games_drafts_table.game_type, gameType)).run();
}
