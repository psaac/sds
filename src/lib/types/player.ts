export type Player = {
	id: string;
	name: string;
	normalizedName: string;
	active: boolean;
	photoDataUrl?: string | null;
	createdAt: string;
	updatedAt: string;
	lastSeenAt: string;
};
