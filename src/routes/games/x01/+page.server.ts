import { getGameDraft, saveGameDraft as persistGameDraft } from '$lib/server/game';
import type { X01Draft } from '$lib/types/useX01';
import { updateAppSetting } from '$lib/server/app-settings';
import { fail } from '@sveltejs/kit';

const parseDraftFromFormData = (formData: FormData): X01Draft | null => {
	const rawDraft = formData.get('gameDraft');

	if (typeof rawDraft !== 'string') {
		return null;
	}

	try {
		return JSON.parse(rawDraft) as X01Draft;
	} catch {
		return null;
	}
};

export const load = async () => {
	const draft = getGameDraft<X01Draft>('x01');
	return { draft };
};

export const actions = {
	startGame: async ({ request }) => {
		const formData = await request.formData();
		const gameDraft = parseDraftFromFormData(formData);

		if (!gameDraft) {
			return fail(400, { error: 'Invalid gameDraft payload.' });
		}

		updateAppSetting('x01_config', gameDraft.config);

		persistGameDraft('x01', gameDraft satisfies X01Draft);
	},
	saveGameDraft: async ({ request }) => {
		const formData = await request.formData();
		const gameDraft = parseDraftFromFormData(formData);

		if (!gameDraft) {
			return fail(400, { error: 'Invalid gameDraft payload.' });
		}

		persistGameDraft('x01', gameDraft);
		return { success: true };
	},
	deleteGameDraft: async () => {
		persistGameDraft('x01', null);
	}
};
