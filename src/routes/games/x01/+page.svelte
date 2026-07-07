<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Field } from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { generateUUID } from '$lib/uuid';
	import {
		defaultConfigX01,
		getInitialPlayers,
		type CurrentTurnX01,
		type LegX01,
		type PlayerX01,
		type SetX01,
		GOAL_OPTIONS,
		isSelectedGoal,
		type X01Draft,
		hasInvalidPlayers,
		type ThrowX01
	} from '$lib/types/useX01';
	import { PlayerManager, GameStatSection, ManualScorer, Divider } from '$lib/components';
	import { Calculator, LoaderCircle, Target } from '@lucide/svelte';

	let { data } = $props();

	let config = $state(defaultConfigX01);

	// Game definition
	let players = $derived<PlayerX01[]>(getInitialPlayers(data.activePlayers ?? []));
	let currentTurn = $derived<CurrentTurnX01>({
		playerId: getInitialPlayers(data.activePlayers ?? [])[0].id,
		score: getInitialPlayers(data.activePlayers ?? [])[0].score,
		throws: []
	});
	let currentScore = $state(0);
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

	const currentPlayer = $derived(players.find((p) => p.id === currentTurn.playerId));
	const currentPlayerPhoto = $derived(
		data.activePlayers.find((p) => p.id === currentTurn.playerId)?.photoPath
	);

	let gameStartedAtRef = new Date().toISOString();
	let hasSavedGameRef = false;
	let ready = $state(false);
	let showResumeBanner = $state(false);
	let manualScorer = $state(false);
	let isDeletingDraft = $state(false);
	let saveDraftFormRef: HTMLFormElement | null = null;
	let saveDraftPayload = $state('');
	const draft = $derived(data.draft);

	$effect(() => {
		if (draft && draft?.ready) {
			gameStartedAtRef = draft.startedAt;
			config = draft.config;
			manualScorer = draft.manualScorer;
			players = draft.players;
			currentLeg = draft.currentLeg;
			currentSet = draft.currentSet;
			sets = draft.sets;

			const currentPlayerFromDraft =
				draft.players.find((p) => p.id === draft!.currentTurn.playerId) ?? draft.players[0];

			if (currentPlayerFromDraft) {
				currentTurn = {
					playerId: currentPlayerFromDraft.id,
					score: currentPlayerFromDraft.score,
					throws: draft.currentTurn.throws
				};
				currentScore = currentPlayerFromDraft.score;
			}

			showResumeBanner = true;
		}
	});

	function handleNextPlayer() {
		const finishedPlayer = players.find((p) => p.id === currentTurn.playerId);
		const nextIndex =
			players.indexOf(players.find((p) => p.id === currentTurn.playerId) as PlayerX01) + 1;
		const nextPlayer = nextIndex > players.length - 1 ? players[0] : players[nextIndex];
		currentLeg = {
			...currentLeg,
			history: [
				...currentLeg.history,
				{
					playerId: finishedPlayer?.id || 0,
					throws: currentTurn.throws
				}
			]
		};
		currentTurn = {
			playerId: nextPlayer.id,
			score: nextPlayer.score,
			throws: []
		};
		currentScore = nextPlayer.score;
		saveGameDraft();
		busted = false;
	}

	const onThrow = (score: number, multiplier: 1 | 2 | 3) => {
		if (currentTurn.throws.length >= 3 || busted || currentPlayer?.score === 0) {
			return;
		}

		const totalPoints = score * multiplier;

		if (multiplier !== 2 && config.doublein && currentScore === config.goal) {
			return;
		}

		currentScore = currentScore - totalPoints;

		if (currentScore < 0) busted = true;
		else if (config.doubleout && currentScore === 1) {
			busted = true;
		} else {
			// Update current turn with the new throw
			currentTurn = {
				...currentTurn,
				throws: [...currentTurn.throws, { score, multiplier }],
				playerId: currentTurn.playerId,
				score: currentScore
			};

			// update current player score + current turn score also
			players = players.map((player) =>
				player.id === currentTurn.playerId ? { ...player, score: currentScore } : player
			);

			if (currentScore - totalPoints === 0) {
				if (config.doubleout && multiplier !== 2) return (busted = true);
				const winnerId = currentTurn.playerId;

				players = players.map((player) =>
					player.id === currentTurn.playerId ? { ...player, score: 0 } : player
				);

				const finishedLeg = {
					...currentLeg,
					winnerId,
					history: [
						...currentLeg.history,
						{
							throws: [...currentTurn.throws, { score, multiplier }],
							playerId: currentTurn.playerId
						}
					]
				};

				const legsWonByPlayer = currentSet.legs.filter((l) => l.winnerId === winnerId).length + 1;
				const setWon = legsWonByPlayer === config.legs;

				if (setWon) {
					const finishedSet: SetX01 = {
						winnerId,
						legs: [...currentSet.legs, finishedLeg]
					};

					const setsWonByPlayer = sets.filter((s) => s.winnerId === winnerId).length + 1;
					const gameWon = setsWonByPlayer === config.sets;

					if (gameWon) {
						sets = [...sets, finishedSet];
						currentSet = finishedSet;
						currentLeg = finishedLeg;
						gameOver = true;
						return;
					}

					sets = [...sets, finishedSet];
					currentSet = finishedSet;
					currentLeg = finishedLeg;
					setEnded = true;
					return;
				}

				currentLeg = finishedLeg;
				legEnded = true;
			}
		}

		if (currentTurn.throws.length >= 3 || busted || currentPlayer?.score === 0) {
			const timeoutId = setTimeout(() => {
				handleNextPlayer();
				clearTimeout(timeoutId);
			}, 1200);

			// return () => {
			// 	clearTimeout(timeoutId);
			// };
		} else {
			saveGameDraft();
		}
	};

	// Handle previous player
	const handleUndoPreviousThrows = () => {
		// Go back using the history of the current leg
		const previousPlayerHistory = currentLeg.history.filter(
			(p) => p.playerId !== currentTurn.playerId
		);
		if (previousPlayerHistory.length === 0) {
			return;
		}
		const lastHistory = previousPlayerHistory.at(-1);
		if (!lastHistory) {
			return;
		}
	};

	const onUndo = () => {
		let lastThrow: ThrowX01 | null = null;
		if (currentTurn.throws.length === 0) {
			if (currentLeg.history.length > 0) {
				currentTurn = currentLeg.history.at(-1)! as CurrentTurnX01;
				// Remove last turn from history
				currentLeg = {
					...currentLeg,
					history: currentLeg.history.slice(0, -1)
				};
			}
		}

		if (currentTurn.throws.length > 0) {
			lastThrow = currentTurn.throws.at(-1)!;
		}

		if (!lastThrow) {
			return;
		}

		const newCurrentTurnThrows = currentTurn.throws.slice(0, -1);
		const previousTurnsScore = currentLeg.history
			.filter((turn) => turn.playerId === currentTurn.playerId)
			.flatMap((turn) => turn.throws)
			.reduce((total, throwValue) => total + throwValue.score * throwValue.multiplier, 0);
		const currentTurnScore = newCurrentTurnThrows.reduce(
			(total, throwValue) => total + throwValue.score * throwValue.multiplier,
			0
		);

		// Recalculate the player's score from the leg history and the current turn, then remove the undone throw.
		currentScore = config.goal - previousTurnsScore - currentTurnScore;
		currentTurn = {
			playerId: currentTurn.playerId,
			score: currentScore,
			throws: newCurrentTurnThrows
		};
		// update current player score
		players = players.map((player) =>
			player.id === currentTurn.playerId ? { ...player, score: currentScore } : player
		);

		busted = false;

		saveGameDraft();
	};

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
			playerId: players[0].id,
			score: players[0].score,
			throws: []
		};
		currentScore = config.goal;
	};

	const handleNewSet = () => {
		setEnded = false;
		currentSet = { winnerId: null, legs: [] };
		currentLeg = { id: generateUUID(), winnerId: null, history: [] };
		currentTurn = {
			playerId: players[0].id,
			score: players[0].score,
			throws: []
		};
		currentScore = config.goal;
		players = players.map((o) => ({ ...o, score: config.goal, rounds: [] }));
	};

	const getGameDraft = (
		start: string,
		players: PlayerX01[],
		currentTurn: CurrentTurnX01
	): X01Draft => ({
		startedAt: start,
		ready: true,
		manualScorer,
		config,
		players,
		currentTurn,
		currentLeg,
		currentSet,
		sets
	});

	const handleReady: SubmitFunction = ({ formData }) => {
		const startedAt = new Date().toISOString();
		gameStartedAtRef = startedAt;
		hasSavedGameRef = false;
		ready = true;
		currentScore = config.goal;
		const readyPlayers = players.map((p) => ({
			...p,
			score: config.goal
		}));
		players = readyPlayers;
		currentTurn = {
			playerId: readyPlayers[0].id,
			score: readyPlayers[0].score,
			throws: []
		};

		formData.set('gameDraft', JSON.stringify(getGameDraft(startedAt, readyPlayers, currentTurn)));
	};

	const handleDeleteGameDraft: SubmitFunction = () => {
		isDeletingDraft = true;
		return async ({ update }) => {
			await update();
		};
	};

	const saveGameDraft = async () => {
		saveDraftPayload = JSON.stringify(getGameDraft(gameStartedAtRef, players, currentTurn));
		await tick();
		saveDraftFormRef?.requestSubmit();
	};
</script>

<form
	bind:this={saveDraftFormRef}
	action="?/saveGameDraft"
	method="POST"
	class="hidden"
	aria-hidden="true"
	use:enhance
>
	<input type="hidden" name="gameDraft" value={saveDraftPayload} />
</form>

{#if !ready}
	{#if showResumeBanner}
		<div class="resume-banner">
			<p class="text-sm">A game in progress has been detected.</p>
			<div class="flex gap-2">
				<Button
					variant="default"
					onclick={() => {
						ready = true;
						showResumeBanner = false;
					}}
				>
					Resume
				</Button>
				<form
					action="?/deleteGameDraft"
					method="POST"
					class="w-full"
					use:enhance={handleDeleteGameDraft}
				>
					<Button variant="secondary" type="submit" disabled={isDeletingDraft}>
						{#if isDeletingDraft}
							<LoaderCircle class="mr-2 size-4 animate-spin" />
						{/if}
						New Game
					</Button>
				</form>
			</div>
		</div>
	{:else}
		<div class="flex w-full flex-col gap-2">
			<Label for="starting-score" class="text-left text-xl font-semibold">Starting Score:</Label>
			<ButtonGroup id="starting-score" class="mx-auto">
				{#each GOAL_OPTIONS as goal}
					<Button
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

		<PlayerManager bind:gamePlayers={players} activePlayers={data.activePlayers ?? []} />

		<form action="?/startGame" method="POST" class="w-full" use:enhance={handleReady}>
			<Button disabled={hasInvalidPlayers(players)} class="w-full py-5" type="submit">
				<Target class="size-6" />
				Play
			</Button>
		</form>
	{/if}
{:else}
	<!-- Game in progress UI goes here -->
	<div class="flex w-full flex-col gap-2 px-2 md:m-auto md:h-full">
		<div class="flex flex-row justify-between md:m-auto md:w-2/3 md:flex-row md:px-4">
			<div class="turn-strip flex w-full flex-row justify-between md:m-auto md:flex-row">
				<div class="flex items-center gap-2">
					<!-- Hide if leg is 1 and set is 1 -->
					{#if config.legs > 1 || config.sets > 1}
						<p>
							Leg {currentSet.legs.length + 1}/{config.legs}
							<br />
							Set {sets.length + 1}/{config.sets}
						</p>
					{/if}
				</div>

				<div class="flex items-center gap-2">
					<h2 class="inline-flex w-fit items-center gap-2 text-center text-2xl font-bold">
						{#if currentPlayerPhoto}
							<img
								src={currentPlayerPhoto}
								alt={currentPlayer?.name}
								class="h-12 w-12 rounded-full border border-border object-cover"
							/>
						{/if}
						{currentPlayer?.name}
					</h2>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="default"
						class="h-10 w-10 border border-accent"
						onclick={() => (manualScorer = !manualScorer)}
					>
						{#if manualScorer}
							<Target class="size-5" />
						{:else}
							<Calculator class="size-5" />
						{/if}
					</Button>
				</div>
			</div>
		</div>

		{#if manualScorer}
			<ManualScorer
				headerLabel="Score:"
				{currentScore}
				throws={currentTurn.throws}
				values={Array.from({ length: 20 }, (_, index) => ({
					score: index + 1,
					label: String(index + 1)
				}))}
				{onThrow}
				{onUndo}
				isError={busted}
				throwSelectionLocked={busted ||
					currentTurn.throws.length >= 3 ||
					currentPlayer?.score === 0}
				renderThrowValue={(throwValue) => throwValue.score * throwValue.multiplier}
			/>
		{:else}
			<!-- <X01BoardScorer {game} {config} /> -->
		{/if}
		<Divider class="my-2" />
		<GameStatSection {sets} {players} {currentSet} {currentLeg} {config} {currentTurn} />
		<!-- 
		<LegOverDialog
        open={
          legDialogOpen && legEnded && !setEnded && !gameOver
        }
        players={players}
        currentLeg={currentLeg}
        continueGame={handleNewLeg}
        undoLastThrow={() => {
          handleUndoLastThrow();
          setLegDialogOpen(false);
        }}
      />
      <SetOverDialog
        open={setDialogOpen && setEnded && !gameOver}
        players={players}
        currentSet={currentSet}
        continueGame={handleNewSet}
        undoLastThrow={() => {
          handleUndoLastThrow();
          setSetDialogOpen(false);
        }}
      />
      <GameOverDialog
        open={gameDialogOpen && gameOver}
        players={game.players}
        sets={game.sets}
        undoLastThrow={() => {
          game.handleUndoLastThrow();
          setGameDialogOpen(false);
        }}
      /> -->
	</div>
{/if}
