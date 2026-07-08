import { getGameDraft } from '$lib/server/game';
import type { X01Draft } from '$lib/types/useX01';
import { defaultConfigX01 } from '$lib/types/useX01';

export async function load() {
	const draft = getGameDraft<X01Draft>('x01');
	const goal = draft?.config.goal ?? defaultConfigX01.goal;

	return {
		title: `${goal}`,
		// description: 'The classic game of 301, 501, 701, or 1001. First to zero wins!',
		description: '',
		backTo: '/games'
	};
}
