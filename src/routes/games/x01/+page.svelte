<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { generateUUID } from '$lib/uuid';
	import {
		// useX01Game,
		defaultConfigX01,
		initialPlayers,
		type ConfigX01,
		type CurrentTurnX01,
		type LegX01,
		type PlayerX01,
		type SetX01,
		type UndoSnapshotX01,
		GOAL_OPTIONS,
		isSelectedGoal
	} from '$lib/types/useX01';
	import { PlayerManager } from '$lib/components';

	let { data } = $props();

	let config = $state(defaultConfigX01);

	// Game definition
	let players = $state<PlayerX01[]>(initialPlayers);
	let currentTurn = $state<CurrentTurnX01>({
		player: initialPlayers[0],
		throws: []
	});
	let currentScore = $derived(config.goal);
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

	const activePlayer = $derived(players.find((p) => p.id === currentTurn.player.id));

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
			currentScore === config.goal ? 0 : lastThrow.multiplier * lastThrow.score;
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
		players = players.map((o) => ({ ...o, score: config.goal, rounds: [] }));
	};

	// let game = $state(useX01Game(initialPlayers, () => config));
</script>

<!--
<div class="resume-banner">
	<p class="text-sm">A game in progress has been detected.</p>
	<div class="flex gap-2">
		<Button
			class="border border-accent"
			onclick={() => {
				// setReady(true);
				// setShowResumeBanner(false);
			}}
		>
			Resume
		</Button>
		<Button
			variant="secondary"
			onclick={() => {
				// void deleteGameDraft('x01');
				// setShowResumeBanner(false);
				window.location.reload();
			}}
		>
			New Game
		</Button>
	</div>
</div>
-->

<div class="flex w-full flex-col gap-2">
	<Label for="starting-score" class="text-left text-xl font-semibold">Starting Score:</Label>
	<ButtonGroup id="starting-score" class="mx-auto">
		{#each GOAL_OPTIONS as goal}
			<Button
				// key={goal}
				variant={isSelectedGoal(goal, config) ? 'default' : 'outline'}
				onclick={() => (config = { ...config, goal })}
			>
				{goal}
			</Button>
		{/each}
	</ButtonGroup>
</div>

<div class="flex w-full flex-col gap-2 md:flex-row">
	<div class="flex w-full flex-col gap-2 md:w-1/2 md:pr-4">
		<h2 class="inline-flex items-center gap-2 text-xl font-semibold">Double Ins & Outs</h2>
		<div class="inline-flex w-full justify-between md:pt-2 md:pb-1">
			<Label class="text-left" for="double-in">Double In:</Label>
			<Switch
				id="double-in"
				onCheckedChange={(checked) => (config = { ...config, doublein: checked })}
				checked={config.doublein}
			/>
		</div>
		<div class="inline-flex w-full justify-between md:pt-2 md:pb-1">
			<Label class="text-left" for="double-out">Double Out:</Label>
			<Switch
				id="double-out"
				onCheckedChange={(checked) => (config = { ...config, doubleout: checked })}
				checked={config.doubleout}
			/>
		</div>
	</div>
	<div class="flex w-full flex-col gap-2 md:w-1/2 md:pl-4">
		<h2 class="text-xl font-semibold">Legs & Sets</h2>
		<div class="inline-flex w-full justify-between">
			<Label for="input-legs" class="text-left">Legs</Label>
			<Field class="w-16 text-center">
				<Input
					id="input-legs"
					type="number"
					onchange={(e) => (config = { ...config, legs: Number(e.currentTarget.value) })}
					value={config.legs}
				/>
			</Field>
		</div>
		<div class="inline-flex w-full justify-between">
			<Label for="input-sets" class="text-left">Sets</Label>
			<Field class="w-16 text-center">
				<Input
					id="input-sets"
					type="number"
					onchange={(e) => (config = { ...config, sets: Number(e.currentTarget.value) })}
					value={config.sets}
				/>
			</Field>
		</div>
	</div>
</div>

<PlayerManager
	gamePlayers={players}
	// {game.players}
	activePlayers={data.activePlayers ?? []}
	// onAddPlayer={(playerName) => {
	// 	game.setPlayers([
	// 		...game.players,
	// 		{
	// 			score: 0,
	// 			name: playerName,
	// 			rounds: [],
	// 			id: generateUUID()
	// 		}
	// 	]);
	// }}
	// onUpdatePlayerName={handleUpdatePlayerNameById}
	// onRemovePlayer={(playerId) => {
	// 	game.setPlayers(game.players.filter((player) => player.id !== playerId));
	// }}
	helperText="Add players to the game. Players must be created in the /players page first."
/>
