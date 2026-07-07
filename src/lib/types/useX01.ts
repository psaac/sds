import { generateUUID } from '$lib/uuid';
import type { Player } from './player';

export type PlayerX01 = {
	name: string;
	rounds: [ThrowX01, ThrowX01, ThrowX01][];
	id: number;
	score: number;
};

export type TurnX01 = {
	playerId: number;
	throws: ThrowX01[];
};

export type ThrowX01 = {
	multiplier: number;
	score: number;
};

export type ConfigX01 = {
	goal: number;
	doubleout: boolean;
	doublein: boolean;
	legs: number; // first to
	sets: number; // first to
};

export type CurrentTurnX01 = {
	playerId: number;
	score: number;
	throws: ThrowX01[];
};

export type LegX01 = {
	id: string;
	winnerId: number | null;
	history: TurnX01[];
};

export type SetX01 = {
	winnerId: number | null;
	legs: LegX01[];
};

export type GoalOption = 301 | 501 | 701 | 1001;

export const GOAL_OPTIONS = [301, 501, 701, 1001] as const satisfies readonly GoalOption[];

export type X01Draft = {
	startedAt: string;
	ready: boolean;
	manualScorer: boolean;
	config: ConfigX01;
	players: PlayerX01[];
	currentTurn: CurrentTurnX01;
	currentLeg: LegX01;
	currentSet: SetX01;
	sets: SetX01[];
};

export const isSelectedGoal = (goal: GoalOption, config: ConfigX01) => goal === config.goal;

export const defaultConfigX01: ConfigX01 = {
	goal: 501,
	doubleout: false,
	doublein: false,
	legs: 1,
	sets: 1
};

export const getInitialPlayers = (activePlayers: Array<Player>): PlayerX01[] => [
	{
		name: activePlayers[0]?.name ?? '',
		rounds: [],
		id: activePlayers[0]?.id ?? generateUUID(),
		score: 0
	},
	{
		name: activePlayers[1]?.name ?? '',
		rounds: [],
		id: activePlayers[1]?.id ?? generateUUID(),
		score: 0
	}
];

export const hasInvalidPlayers = (players: PlayerX01[]) =>
	players.length < 2 || players.some((player) => player.name.trim() === '');
