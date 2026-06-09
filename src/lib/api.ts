import type { Player } from './types/player';

const API_BASE = '/api';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...(options?.headers ?? {})
		},
		...options
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`API request failed (${response.status} ${response.statusText}): ${body}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

export async function listPlayers(options?: { includeInactive?: boolean }): Promise<Player[]> {
	const query = options?.includeInactive ? '?includeInactive=true' : '';
	return apiRequest<Player[]>(`/players${query}`);
}

export async function createPlayer(
	name: string
): Promise<{ id: number; name: string; active: boolean }> {
	return apiRequest<{ id: number; name: string; active: boolean }>('/players', {
		method: 'POST',
		body: JSON.stringify({ name })
	});
}

export const setPlayerPhoto = async (playerId: number, photoDataUrl: string): Promise<void> => {
	return apiRequest<void>(`/players/${playerId}/photo`, {
		method: 'PUT',
		body: JSON.stringify({ photoDataUrl })
	});
};
