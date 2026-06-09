export type Player = {
	id: number;
	name: string;
	// normalizedName: string;
	active: boolean;
	photoPath?: string | null;
	createdAt: string;
	updatedAt: string;
	lastSeenAt: string;
};

export const getInitials = (playerName: string) =>
	playerName
		.split(' ')
		.map((segment) => segment[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
