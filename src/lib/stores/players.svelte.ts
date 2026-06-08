import { type Player } from '$lib/types/player';
export function createPlayers() {
	let players = $state<Player[]>([]);

	return {
		get players() {
			return players;
		},
		setPlayers: (nextPlayers: Player[]) => {
			players = [...nextPlayers];
		},
		addPlayer: (player: Player) => {
			players = [...players, player];
		},
		removePlayer: (playerId: string) => {
			players = players.filter((player) => player.id !== playerId);
		},
		updatePlayerPhoto: (playerId: string, photoDataUrl: string) => {
			players = players.map((player) =>
				player.id === playerId ? { ...player, photoDataUrl } : player
			);
		}
	};
}

export const playersStore = createPlayers();
