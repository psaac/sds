import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import express, { Request, Response, NextFunction } from 'express';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const dataDir = path.join(projectRoot, 'data');
const databasePath = path.join(dataDir, 'sds.sqlite');

if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

function normalizePlayerName(name: string) {
	return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildPlayerId(name: string) {
	const normalized = normalizePlayerName(name);
	if (!normalized) {
		return `player:${crypto.randomUUID()}`;
	}

	const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	return `player:${slug || 'unknown'}`;
}

async function upsertPlayers(db: Database, playerNames: string[]) {
	const now = new Date().toISOString();
	const uniqueNames = [...new Set(playerNames.map((name) => String(name).trim()).filter(Boolean))];

	const resolved = [];
	await db.exec('BEGIN');

	try {
		for (const name of uniqueNames) {
			const id = buildPlayerId(name);
			const existing = await db.get('SELECT created_at, active FROM players WHERE id = ?', id);

			await db.run(
				`INSERT INTO players (id, name, normalized_name, active, created_at, updated_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           normalized_name = excluded.normalized_name,
           updated_at = excluded.updated_at,
           last_seen_at = excluded.last_seen_at`,
				id,
				name,
				normalizePlayerName(name),
				existing?.active ?? 1,
				existing?.created_at ?? now,
				now,
				now
			);

			resolved.push({ playerId: id, name });
		}

		await db.exec('COMMIT');
		return resolved;
	} catch (error) {
		await db.exec('ROLLBACK');
		throw error;
	}
}

// TODO : change input + player to correct types
async function saveGame(db: Database, input: any) {
	const now = new Date().toISOString();
	const endedAt = input.endedAt ?? now;
	const gameId = `game:${crypto.randomUUID()}`;

	const participants = Array.isArray(input.players) ? input.players : [];
	const resolvedPlayers = await upsertPlayers(
		db,
		participants.map((player: { name: string }) => player.name)
	);
	const playerMap = new Map(resolvedPlayers.map((player) => [player.name, player.playerId]));

	const players = participants.map(
		(player: { name: string; score: number; points: number; lives: number; rank: number }) => ({
			playerId: playerMap.get(player.name) ?? buildPlayerId(player.name),
			name: player.name,
			score: player.score,
			points: player.points,
			lives: player.lives,
			rank: player.rank
		})
	);

	const winnerPlayerId = input.winnerName ? (playerMap.get(input.winnerName) ?? null) : null;

	await db.run(
		`INSERT INTO games (
      id,
      game_type,
      started_at,
      ended_at,
      winner_player_id,
      winner_name,
      players_json,
      config_json,
      metadata_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		gameId,
		input.gameType,
		input.startedAt,
		endedAt,
		winnerPlayerId,
		input.winnerName ?? null,
		JSON.stringify(players),
		input.config ? JSON.stringify(input.config) : null,
		input.metadata ? JSON.stringify(input.metadata) : null,
		now
	);

	return gameId;
}

async function initializeDatabase() {
	const db = await open({
		filename: databasePath,
		driver: sqlite3.Database
	});

	await db.exec('PRAGMA journal_mode = WAL');

	await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      photo_data_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      game_type TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      winner_player_id TEXT,
      winner_name TEXT,
      players_json TEXT NOT NULL,
      config_json TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_drafts (
      game_type TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type);
    CREATE INDEX IF NOT EXISTS idx_games_ended_at ON games(ended_at);
    CREATE INDEX IF NOT EXISTS idx_players_last_seen_at ON players(last_seen_at);
  `);

	const playerColumns = await db.all('PRAGMA table_info(players)');
	if (!playerColumns.some((column) => column.name === 'active')) {
		await db.exec('ALTER TABLE players ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
	}
	if (!playerColumns.some((column) => column.name === 'photo_data_url')) {
		await db.exec('ALTER TABLE players ADD COLUMN photo_data_url TEXT');
	}

	// const legacyPhotoSetting = await db.get(
	// 	`SELECT value_json
	//  FROM app_settings
	//  WHERE key = ?`,
	// 	'player_photos'
	// );

	// if (legacyPhotoSetting?.value_json) {
	// 	try {
	// 		const photoMap = JSON.parse(legacyPhotoSetting.value_json);
	// 		if (photoMap && typeof photoMap === 'object') {
	// 			const now = new Date().toISOString();
	// 			await db.exec('BEGIN');
	// 			try {
	// 				for (const [playerId, photoDataUrl] of Object.entries(photoMap)) {
	// 					if (typeof photoDataUrl !== 'string' || !photoDataUrl) {
	// 						continue;
	// 					}

	// 					await db.run(
	// 						`UPDATE players
	//            SET photo_data_url = ?, updated_at = ?
	//            WHERE id = ?`,
	// 						photoDataUrl,
	// 						now,
	// 						playerId
	// 					);
	// 				}

	// 				await db.run('DELETE FROM app_settings WHERE key = ?', 'player_photos');
	// 				await db.exec('COMMIT');
	// 			} catch (error) {
	// 				await db.exec('ROLLBACK');
	// 				throw error;
	// 			}
	// 		}
	// 	} catch {
	// 		// Ignore invalid legacy payload and keep server boot resilient.
	// 	}
	// }

	return db;
}

async function startServer() {
	const db = await initializeDatabase();

	const app = express();
	app.use(express.json({ limit: '10mb' }));

	app.get('/api/health', (_req, res) => {
		res.json({ ok: true, databasePath });
	});

	app.get('/api/players', async (_req, res) => {
		const includeInactive = _req.query.includeInactive === 'true';
		console.log(`Listing players (includeInactive=${includeInactive})`);

		const rows = await db.all(
			`SELECT id, name, normalized_name, active, photo_data_url, created_at, updated_at, last_seen_at
       FROM players
       ${includeInactive ? '' : 'WHERE active = 1'}
       ORDER BY updated_at DESC`
		);

		res.json(
			rows.map((row) => ({
				id: row.id,
				name: row.name,
				normalizedName: row.normalized_name,
				active: Boolean(row.active),
				photoDataUrl: row.photo_data_url ?? null,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
				lastSeenAt: row.last_seen_at
			}))
		);
	});

	app.post('/api/players', async (req, res) => {
		const rawName = req.body?.name;
		const name = String(rawName ?? '').trim();

		if (!name) {
			return res.status(400).json({ error: 'name is required' });
		}

		const id = buildPlayerId(name);
		const normalizedName = normalizePlayerName(name);
		const now = new Date().toISOString();

		const existing = await db.get('SELECT created_at FROM players WHERE id = ?', id);

		await db.run(
			`INSERT INTO players (id, name, normalized_name, active, created_at, updated_at, last_seen_at)
       VALUES (?, ?, ?, 1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         normalized_name = excluded.normalized_name,
         active = 1,
         updated_at = excluded.updated_at,
         last_seen_at = excluded.last_seen_at`,
			id,
			name,
			normalizedName,
			existing?.created_at ?? now,
			now,
			now
		);

		return res.status(201).json({ id, name, active: true });
	});

	app.patch('/api/players/:playerId', async (req, res) => {
		const { playerId } = req.params;
		const active = req.body?.active;

		if (typeof active !== 'boolean') {
			return res.status(400).json({ error: 'active boolean is required' });
		}

		const now = new Date().toISOString();
		const result = await db.run(
			`UPDATE players
       SET active = ?, updated_at = ?
       WHERE id = ?`,
			active ? 1 : 0,
			now,
			playerId
		);

		if (result.changes === 0) {
			return res.status(404).json({ error: 'player not found' });
		}

		return res.json({ ok: true, id: playerId, active });
	});

	app.post('/api/players/upsert', async (req, res) => {
		const playerNames = req.body?.playerNames;
		if (!Array.isArray(playerNames)) {
			return res.status(400).json({ error: 'playerNames must be an array of strings' });
		}

		const saved = await upsertPlayers(db, playerNames);
		return res.json(saved);
	});

	app.put('/api/players/:playerId/photo', async (req, res) => {
		const { playerId } = req.params;
		const photoDataUrl = req.body?.photoDataUrl;

		if (typeof photoDataUrl !== 'string' || !photoDataUrl) {
			return res.status(400).json({ error: 'photoDataUrl string is required' });
		}

		const now = new Date().toISOString();
		const result = await db.run(
			`UPDATE players
       SET photo_data_url = ?,
           updated_at = ?
       WHERE id = ?`,
			photoDataUrl,
			now,
			playerId
		);

		if (result.changes === 0) {
			return res.status(404).json({ error: 'player not found' });
		}

		return res.json({ ok: true, id: playerId, updatedAt: now });
	});

	app.delete('/api/players/:playerId/photo', async (req, res) => {
		const { playerId } = req.params;
		const now = new Date().toISOString();
		const result = await db.run(
			`UPDATE players
       SET photo_data_url = NULL,
           updated_at = ?
       WHERE id = ?`,
			now,
			playerId
		);

		if (result.changes === 0) {
			return res.status(404).json({ error: 'player not found' });
		}

		return res.status(204).send();
	});

	app.get('/api/games', async (_req, res) => {
		const rows = await db.all(
			`SELECT
        id,
        game_type,
        started_at,
        ended_at,
        winner_player_id,
        winner_name,
        players_json,
        config_json,
        metadata_json
       FROM games
       ORDER BY ended_at DESC`
		);

		res.json(
			rows.map((row) => ({
				id: row.id,
				gameType: row.game_type,
				startedAt: row.started_at,
				endedAt: row.ended_at,
				winnerPlayerId: row.winner_player_id,
				winnerName: row.winner_name,
				players: JSON.parse(row.players_json),
				config: row.config_json ? JSON.parse(row.config_json) : undefined,
				metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined
			}))
		);
	});

	app.post('/api/games', async (req, res) => {
		const input = req.body;

		if (!input || typeof input !== 'object') {
			return res.status(400).json({ error: 'Request body is required' });
		}

		if (!input.gameType || !input.startedAt || !Array.isArray(input.players)) {
			return res.status(400).json({ error: 'gameType, startedAt and players are required' });
		}

		const gameId = await saveGame(db, input);
		return res.status(201).json({ gameId });
	});

	app.get('/api/drafts/:gameType', async (req, res) => {
		const { gameType } = req.params;
		const row = await db.get(
			`SELECT game_type, payload_json, updated_at
       FROM game_drafts
       WHERE game_type = ?`,
			gameType
		);

		if (!row) {
			return res.status(204).send();
		}

		return res.json({
			gameType: row.game_type,
			payload: JSON.parse(row.payload_json),
			updatedAt: row.updated_at
		});
	});

	app.put('/api/drafts/:gameType', async (req, res) => {
		const { gameType } = req.params;
		const payload = req.body?.payload;

		if (!payload || typeof payload !== 'object') {
			return res.status(400).json({ error: 'payload object is required' });
		}

		const now = new Date().toISOString();

		await db.run(
			`INSERT INTO game_drafts (game_type, payload_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(game_type) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
			gameType,
			JSON.stringify(payload),
			now
		);

		return res.json({ ok: true, gameType, updatedAt: now });
	});

	app.delete('/api/drafts/:gameType', async (req, res) => {
		const { gameType } = req.params;

		await db.run('DELETE FROM game_drafts WHERE game_type = ?', gameType);

		return res.status(204).send();
	});

	app.get('/api/settings/:key', async (req, res) => {
		const { key } = req.params;

		const row = await db.get(
			`SELECT key, value_json, updated_at
       FROM app_settings
       WHERE key = ?`,
			key
		);

		if (!row) {
			return res.status(204).send();
		}

		return res.json({
			key: row.key,
			value: JSON.parse(row.value_json),
			updatedAt: row.updated_at
		});
	});

	app.put('/api/settings/:key', async (req, res) => {
		const { key } = req.params;
		const value = req.body?.value;

		if (value === undefined) {
			return res.status(400).json({ error: 'value is required' });
		}

		const now = new Date().toISOString();

		await db.run(
			`INSERT INTO app_settings (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
			key,
			JSON.stringify(value),
			now
		);

		return res.json({ ok: true, key, updatedAt: now });
	});

	app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
		console.error(error);
		res.status(500).json({ error: 'Internal server error' });
	});

	const port = Number(process.env.PORT ?? 8787);
	app.listen(port, () => {
		console.log(`[sds-server] listening on http://localhost:${port}`);
		console.log(`[sds-server] sqlite: ${databasePath}`);
	});
}

startServer().catch((error) => {
	console.error('[sds-server] startup failed', error);
	process.exit(1);
});
