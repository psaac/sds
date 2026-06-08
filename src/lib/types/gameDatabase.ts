const API_BASE = "/api";

export type SupportedGameType = "x01" | "cricket" | "killer" | "shanghai";

export type PlayerRecord = {
  id: string;
  name: string;
  normalizedName: string;
  active: boolean;
  photoDataUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type PlayerGameSummary = {
  playerId: string;
  name: string;
  score?: number;
  points?: number;
  lives?: number;
  rank?: number;
};

export type GameRecord = {
  id: string;
  gameType: SupportedGameType;
  startedAt: string;
  endedAt: string;
  winnerPlayerId: string | null;
  winnerName: string | null;
  players: PlayerGameSummary[];
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type GameDraftRecord<TPayload = Record<string, unknown>> = {
  gameType: SupportedGameType;
  payload: TPayload;
  updatedAt: string;
};

export type SettingRecord<TValue = unknown> = {
  key: string;
  value: TValue;
  updatedAt: string;
};

type CompletedGameInput = {
  gameType: SupportedGameType;
  startedAt: string;
  endedAt?: string;
  winnerName?: string | null;
  players: Array<{
    name: string;
    score?: number;
    points?: number;
    lives?: number;
    rank?: number;
  }>;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function listLegacyPlayerPhotoMap(): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE}/player-photos`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404 || response.status === 204) {
    return {};
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return (await response.json()) as Record<string, string>;
}

async function saveLegacyPlayerPhotoMap(
  photoMap: Record<string, string>,
): Promise<void> {
  const response = await fetch(`${API_BASE}/player-photos`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ photoMap }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }
}

async function listPhotoMapFromSettings(): Promise<Record<string, string>> {
  const setting = await getSetting<Record<string, string>>("player_photos");
  return setting?.value ?? {};
}

async function savePhotoMapToSettings(
  photoMap: Record<string, string>,
): Promise<void> {
  await upsertSetting("player_photos", photoMap);
}

export async function upsertPlayers(
  playerNames: string[],
): Promise<Array<{ playerId: string; name: string }>> {
  return apiRequest<Array<{ playerId: string; name: string }>>(
    "/players/upsert",
    {
      method: "POST",
      body: JSON.stringify({ playerNames }),
    },
  );
}

export async function setPlayerPhoto(
  playerId: string,
  photoDataUrl: string,
): Promise<void> {
  const response = await fetch(`${API_BASE}/players/${playerId}/photo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ photoDataUrl }),
  });

  if (response.ok) {
    return;
  }

  // Compatibility fallback for older backends using global photo map endpoint.
  if (response.status === 404) {
    try {
      const legacyPhotoMap = await listLegacyPlayerPhotoMap();
      await saveLegacyPlayerPhotoMap({
        ...legacyPhotoMap,
        [playerId]: photoDataUrl,
      });
      return;
    } catch {
      const settingsPhotoMap = await listPhotoMapFromSettings();
      await savePhotoMapToSettings({
        ...settingsPhotoMap,
        [playerId]: photoDataUrl,
      });
    }
    return;
  }

  const body = await response.text();
  throw new Error(
    `API request failed (${response.status} ${response.statusText}): ${body}`,
  );
}

export async function removePlayerPhoto(playerId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/players/${playerId}/photo`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 204) {
    return;
  }

  if (response.status === 404) {
    try {
      const legacyPhotoMap = await listLegacyPlayerPhotoMap();
      if (!(playerId in legacyPhotoMap)) {
        return;
      }

      const nextPhotoMap = { ...legacyPhotoMap };
      delete nextPhotoMap[playerId];
      await saveLegacyPlayerPhotoMap(nextPhotoMap);
      return;
    } catch {
      const settingsPhotoMap = await listPhotoMapFromSettings();
      if (!(playerId in settingsPhotoMap)) {
        return;
      }

      const nextPhotoMap = { ...settingsPhotoMap };
      delete nextPhotoMap[playerId];
      await savePhotoMapToSettings(nextPhotoMap);
    }
    return;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }
}

export async function saveCompletedGame(
  input: CompletedGameInput,
): Promise<string> {
  const response = await apiRequest<{ gameId: string }>("/games", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.gameId;
}

export async function listPlayers(options?: {
  includeInactive?: boolean;
}): Promise<PlayerRecord[]> {
  const query = options?.includeInactive ? "?includeInactive=true" : "";
  return apiRequest<PlayerRecord[]>(`/players${query}`);
}

export async function createPlayer(
  name: string,
): Promise<{ id: string; name: string; active: boolean }> {
  return apiRequest<{ id: string; name: string; active: boolean }>("/players", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function setPlayerActive(
  playerId: string,
  active: boolean,
): Promise<void> {
  await apiRequest<{ ok: true }>(`/players/${playerId}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export async function listGames(): Promise<GameRecord[]> {
  return apiRequest<GameRecord[]>("/games");
}

export async function getGameDraft<TPayload>(
  gameType: SupportedGameType,
): Promise<GameDraftRecord<TPayload> | null> {
  const response = await fetch(`${API_BASE}/drafts/${gameType}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return (await response.json()) as GameDraftRecord<TPayload>;
}

export async function upsertGameDraft<TPayload>(
  gameType: SupportedGameType,
  payload: TPayload,
): Promise<void> {
  await apiRequest<{ ok: true }>(`/drafts/${gameType}`, {
    method: "PUT",
    body: JSON.stringify({ payload }),
  });
}

export async function deleteGameDraft(
  gameType: SupportedGameType,
): Promise<void> {
  await fetch(`${API_BASE}/drafts/${gameType}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getSetting<TValue>(
  key: string,
): Promise<SettingRecord<TValue> | null> {
  const response = await fetch(`${API_BASE}/settings/${key}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  return (await response.json()) as SettingRecord<TValue>;
}

export async function upsertSetting<TValue>(
  key: string,
  value: TValue,
): Promise<void> {
  console.log("Saving setting", key, value);
  await apiRequest<{ ok: true }>(`/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}
