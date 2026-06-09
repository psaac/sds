import { getAllActivePlayers } from '$lib/server/player';

export const load = async () => {
	return {
		activePlayers: getAllActivePlayers(),
		title: 'Games',
		description: 'Scorekeeping for the most popular darts variants.',
		backTo: '/'
	};
};
