import { generateUUID } from '$lib/uuid';

export type PlayerX01 = {
	name: string;
	rounds: [ThrowX01, ThrowX01, ThrowX01][];
	id: string;
	score: number;
};

export type TurnX01 = {
	playerId: string;
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
	player: PlayerX01;
	throws: ThrowX01[];
};

export type LegX01 = {
	id: string;
	winnerId: string | null;
	history: TurnX01[];
};

export type SetX01 = {
	winnerId: string | null;
	legs: LegX01[];
};

export type GameState = ReturnType<typeof useX01Game>;

export type UndoSnapshotX01 = {
	players: PlayerX01[];
	currentTurn: CurrentTurnX01;
	currentScore: number;
	gameOver: boolean;
	legEnded: boolean;
	setEnded: boolean;
	busted: boolean;
	currentLeg: LegX01;
	currentSet: SetX01;
	sets: SetX01[];
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
	currentScore: number;
	busted: boolean;
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

export const initialPlayers = [
	{
		name: 'Player 1',
		rounds: [],
		id: generateUUID(),
		score: 0
	},
	{
		name: 'Player 2',
		rounds: [],
		id: generateUUID(),
		score: 0
	}
];

export function useX01Game(initialPlayers: PlayerX01[], getConfig: () => ConfigX01) {
	let players = $state<PlayerX01[]>(initialPlayers);
	let currentTurn = $state<CurrentTurnX01>({
		player: initialPlayers[0],
		throws: []
	});
	let currentScore = $state(getConfig().goal);
	let gameOver = $state(false);
	let legEnded = $state(false);
	let setEnded = $state(false);
	let busted = $state(false);
	let currentLeg = $state<LegX01>({
		id: generateUUID(),
		winnerId: null,
		history: []
	});
	let currentSet = $state<SetX01>({
		winnerId: null,
		legs: []
	});
	let sets = $state<SetX01[]>([]);
	let undoSnapshotRef: UndoSnapshotX01 | null = null;

	const activePlayer = players.find((p) => p.id === currentTurn.player.id);

	const createUndoSnapshot = (): UndoSnapshotX01 =>
		structuredClone({
			players,
			currentTurn,
			currentScore,
			gameOver,
			legEnded,
			setEnded,
			busted,
			currentLeg,
			currentSet,
			sets
		});

	function captureUndoSnapshot() {
		undoSnapshotRef = createUndoSnapshot();
	}

	function handleNextPlayer() {
		captureUndoSnapshot();

		busted = false;
		const finishedPlayer = players.find((p) => p.id === currentTurn.player.id);
		players = players.map((player) =>
			player.id === currentTurn.player.id
				? {
						...player,
						score: busted ? (finishedPlayer?.score ?? 0) : currentScore
					}
				: player
		);

		const nextIndex =
			players.indexOf(players.find((p) => p.id === currentTurn.player.id) as PlayerX01) + 1;
		const nextPlayer = nextIndex > players.length - 1 ? players[0] : players[nextIndex];
		currentLeg = {
			...currentLeg,
			history: [
				...currentLeg.history,
				{
					playerId: finishedPlayer?.id || '',
					throws: currentTurn.throws
				}
			]
		};
		currentTurn = {
			player: nextPlayer,
			throws: []
		};
		currentScore =
			nextPlayer.id === currentTurn.player.id && !busted ? currentScore : nextPlayer.score;
	}

	function handleDeleteLast() {
		if (currentTurn.throws.length === 0) {
			handleUndoLastThrow();
			return;
		}

		const lastThrow = currentTurn.throws.at(-1);

		if (!lastThrow) {
			return;
		}

		const newCurrentTurnThrows = currentTurn.throws.slice(0, -1);

		const scoreToRestore =
			currentScore === getConfig().goal ? 0 : lastThrow.multiplier * lastThrow.score;
		const newCurrentScore = currentScore + scoreToRestore;

		currentScore = newCurrentScore;
		currentTurn = { ...currentTurn, throws: newCurrentTurnThrows };

		if (busted) {
			busted = false;
		}
	}

	function handleUndoLastThrow() {
		const snapshot = undoSnapshotRef;

		if (!snapshot) {
			return;
		}

		players = snapshot.players;
		currentTurn = snapshot.currentTurn;
		currentScore = snapshot.currentScore;
		gameOver = snapshot.gameOver;
		legEnded = snapshot.legEnded;
		setEnded = snapshot.setEnded;
		busted = snapshot.busted;
		currentLeg = snapshot.currentLeg;
		currentSet = snapshot.currentSet;
		sets = snapshot.sets;
		undoSnapshotRef = null;
	}

	const handleNewLeg = () => {
		if (!legEnded) return;
		legEnded = false;
		currentSet = {
			...currentSet,
			legs: [...currentSet.legs, currentLeg]
		};
		currentLeg = {
			id: generateUUID(),
			winnerId: null,
			history: []
		};
		players = players.map((o) => ({ ...o, score: getConfig().goal, rounds: [] }));
		currentTurn = {
			player: players[0],
			throws: []
		};
		currentScore = getConfig().goal;
	};

	const handleNewSet = () => {
		setEnded = false;
		currentSet = { winnerId: null, legs: [] };
		currentLeg = { id: generateUUID(), winnerId: null, history: [] };
		currentTurn = {
			player: players[0],
			throws: []
		};
		currentScore = getConfig().goal;
		players = players.map((o) => ({ ...o, score: getConfig().goal, rounds: [] }));
	};

	return {
		players,
		currentTurn,
		currentScore,
		gameOver,
		legEnded,
		setEnded,
		busted,
		currentLeg,
		currentSet,
		sets,
		activePlayer,
		handleNextPlayer,
		handleDeleteLast,
		captureUndoSnapshot,
		handleUndoLastThrow,
		handleNewLeg,
		handleNewSet
	};
}
