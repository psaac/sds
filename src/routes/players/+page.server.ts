import { getAllPlayers, addPlayer, updatePlayer } from '$lib/server/player';

export const load = async () => {
	return { players: getAllPlayers() };
};

export const actions = {
	post: async ({ request }) => {
		const formData = await request.formData();
		addPlayer(formData.get('name') as string);
	},
	uploadPhoto: async ({ request }) => {
		console.log('Uploading photo for player ID:');
		const formData = await request.formData();
		const id = parseInt(formData.get('playerId') as string);

		updatePlayer(id, { photoDataUrl: formData.get('photoDataUrl') as string });
	}
};
