import { generateUUID } from '$lib/uuid';
// import { useRef, useState } from 'react';

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

type UndoSnapshotX01 = {
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

export function useX01Game(initialPlayers: PlayerX01[], config: ConfigX01) {
	let players = $state<PlayerX01[]>(initialPlayers);
	let currentTurn = $state<CurrentTurnX01>({
		player: initialPlayers[0],
		throws: []
	});
	let currentScore = $state(config.goal);
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
	//const undoSnapshotRef = useRef<UndoSnapshotX01 | null>(null);
	// TODO : find a way to implement undo without useRef, maybe with a state that we reset to null after use

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
		// undoSnapshotRef.current = createUndoSnapshot();
	}

	function handleNextPlayer() {
		// undoSnapshotRef.current = createUndoSnapshot();

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
			currentScore === config.goal ? 0 : lastThrow.multiplier * lastThrow.score;
		const newCurrentScore = currentScore + scoreToRestore;

		currentScore = newCurrentScore;
		currentTurn = { ...currentTurn, throws: newCurrentTurnThrows };

		if (busted) {
			busted = false;
		}
	}

	function handleUndoLastThrow() {
		// const snapshot = undoSnapshotRef.current;
		// if (!snapshot) {
		// 	return;
		// }
		// players = snapshot.players;
		// currentTurn = snapshot.currentTurn;
		// currentScore = snapshot.currentScore;
		// gameOver = snapshot.gameOver;
		// legEnded = snapshot.legEnded;
		// setEnded = snapshot.setEnded;
		// busted = snapshot.busted;
		// currentLeg = snapshot.currentLeg;
		// currentSet = snapshot.currentSet;
		// sets = snapshot.sets;
		// undoSnapshotRef.current = null;
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
		players = players.map((o) => ({ ...o, score: config.goal, rounds: [] }));
		currentTurn = {
			player: players[0],
			throws: []
		};
		currentScore = config.goal;
	};

	const handleNewSet = () => {
		setEnded = false;
		currentSet = { winnerId: null, legs: [] };
		currentLeg = { id: generateUUID(), winnerId: null, history: [] };
		currentTurn = {
			player: players[0],
			throws: []
		};
		currentScore = config.goal;
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
