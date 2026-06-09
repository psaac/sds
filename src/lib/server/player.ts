import { eq } from 'drizzle-orm';
import { db } from './db';
import { players_table, type Player } from './schema';

export function addPlayer(name: string): Player[] {
	return db.insert(players_table).values({ name, active: true }).returning().all();
}

export function getPlayer(id: number): Player | undefined {
	const players = db.select().from(players_table).where(eq(players_table.id, id)).all();
	return players[0];
}

export function getAllPlayers(): Player[] {
	return db.select().from(players_table).all();
}

export const getAllActivePlayers = () => {
	return db.select().from(players_table).where(eq(players_table.active, true)).all();
};

export function updatePlayer(id: number, updates: Partial<Player>) {
	db.update(players_table).set(updates).where(eq(players_table.id, id)).run();
}
