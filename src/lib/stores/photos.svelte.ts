import { type Player } from '$lib/types/player';
export function createPhotos() {
	let photos = $state<Player[]>([]);

	return {
		get photos() {
			return photos;
		},
		setPhotos: (nextPhotos: Player[]) => {
			photos = [...nextPhotos];
		},
		setPhoto: (playerId: string, photoDataUrl: string) => {
			photos = photos.map((player) =>
				player.id === playerId ? { ...player, photoDataUrl } : player
			);
		}
	};
}

export const playerPhotosStore = createPhotos();
