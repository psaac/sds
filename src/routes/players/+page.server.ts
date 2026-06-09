import {
	deletePlayerPhotoFile,
	savePlayerPhotoFromDataUrl,
	savePlayerPhotoFromUpload
} from '$lib/server/player-photo';
import { addPlayer, getAllPlayers, getPlayer, updatePlayer } from '$lib/server/player';

export const load = async () => {
	return { players: getAllPlayers() };
};

export const actions = {
	post: async ({ request }) => {
		const formData = await request.formData();
		addPlayer(formData.get('name') as string);
	},
	uploadPhoto: async ({ request }) => {
		const formData = await request.formData();
		const id = Number.parseInt(formData.get('playerId') as string, 10);
		if (!Number.isInteger(id)) {
			return;
		}

		const player = getPlayer(id);
		if (!player) {
			return;
		}

		const uploadedPhoto = formData.get('photo');
		const photoDataUrl = formData.get('photoDataUrl');

		let photoPath: string | null = null;
		if (uploadedPhoto instanceof File && uploadedPhoto.size > 0) {
			photoPath = await savePlayerPhotoFromUpload(uploadedPhoto);
		} else if (typeof photoDataUrl === 'string' && photoDataUrl) {
			photoPath = await savePlayerPhotoFromDataUrl(photoDataUrl);
		}

		if (!photoPath) {
			return;
		}

		updatePlayer(id, { photoPath });
		if (player.photoPath && player.photoPath !== photoPath) {
			await deletePlayerPhotoFile(player.photoPath);
		}
	},
	deletePhoto: async ({ request }) => {
		const formData = await request.formData();
		const id = Number.parseInt(formData.get('playerId') as string, 10);
		if (!Number.isInteger(id)) {
			return;
		}

		const player = getPlayer(id);
		if (!player) {
			return;
		}

		updatePlayer(id, { photoPath: null });
		await deletePlayerPhotoFile(player.photoPath);
	},
	togglePlayer: async ({ request }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get('playerId') as string);
		const active = formData.get('active') === 'true';

		updatePlayer(id, { active: !active });
	}
};
