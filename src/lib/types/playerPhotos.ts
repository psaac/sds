// import {
// 	listPlayers,
// 	getSetting,
// 	removePlayerPhoto as removePlayerPhotoInDb,
// 	setPlayerPhoto as setPlayerPhotoInDb
// } from '$lib/types/gameDatabase';

export type PlayerPhotoMap = Record<string, string>;

// export async function listPlayerPhotos(): Promise<PlayerPhotoMap> {
// 	const players = await listPlayers({ includeInactive: true });
// 	const photoMapFromPlayers = players.reduce<PlayerPhotoMap>((acc, player) => {
// 		if (typeof player.photoDataUrl === 'string' && player.photoDataUrl) {
// 			acc[player.id] = player.photoDataUrl;
// 		}

// 		return acc;
// 	}, {});

// 	const hasPhotoDataUrlField = players.some((player) => 'photoDataUrl' in player);
// 	if (hasPhotoDataUrlField) {
// 		return photoMapFromPlayers;
// 	}

// 	const legacySetting = await getSetting<PlayerPhotoMap>('player_photos');
// 	return legacySetting?.value ?? {};
// }

// export async function setPlayerPhoto(playerId: string, photoDataUrl: string): Promise<void> {
// 	await setPlayerPhotoInDb(playerId, photoDataUrl);
// }

// export async function removePlayerPhoto(playerId: string): Promise<void> {
// 	await removePlayerPhotoInDb(playerId);
// }
