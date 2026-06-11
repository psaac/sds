// import {
// 	deletePlayerPhotoFile,
// 	savePlayerPhotoFromDataUrl,
// 	savePlayerPhotoFromUpload
// } from '$lib/server/player-photo';
import { addPlayer, getAllPlayers, getPlayer, updatePlayer } from '$lib/server/player';
import { getGameDraft, saveGameDraft } from '$lib/server/game';
import type {
	ConfigX01,
	CurrentTurnX01,
	LegX01,
	PlayerX01,
	SetX01,
	X01Draft
} from '$lib/types/useX01';
import { generateUUID } from '$lib/uuid';
import { updateAppSetting } from '$lib/server/app-settings';

export const load = async () => {
	const draft = getGameDraft<X01Draft>('x01');
	return { draft };
};

export const actions = {
	startGame: async ({ request }) => {
		const formData = await request.formData();
		console.log('Form data received in startGame action:', formData);
		const gameDraft = JSON.parse(formData.get('gameDraft') as string) as X01Draft;

		updateAppSetting('x01_config', gameDraft.config);
		// void upsertPlayers(game.players.map((p) => p.name)).catch((error) => {
		// 	console.error('Could not persist players for x01', error);
		// });

		saveGameDraft('x01', gameDraft satisfies X01Draft);
	}
};
