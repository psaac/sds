import type { Player } from '$lib/types/player';

export const load = async ({ fetch }) => {
	const result = {
		players: [] as Array<Player>,
		playersLoadError: 'Failed to load players'
	};
	try {
		const response = await fetch('/api/players');

		if (response.ok) {
			const players = (await response.json()) as Array<Player>;
			result.players = players;
			result.playersLoadError = '';
		} else {
			result.playersLoadError = `Failed to load players (${response.status})`;
		}
	} catch (error) {
		result.playersLoadError = error instanceof Error ? error.message : 'Failed to load players';
	}

	return result;
};
