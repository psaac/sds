export type Player = {
	id: number;
	name: string;
	// normalizedName: string;
	active: boolean;
	photoDataUrl?: string | null;
	createdAt: string;
	updatedAt: string;
	lastSeenAt: string;
};
