import { getAllPlayers } from '$lib/server/player';

export const load = async () => {
	return { players: getAllPlayers() };
};
