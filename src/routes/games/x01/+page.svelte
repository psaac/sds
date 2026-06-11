<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import { generateUUID } from '$lib/uuid';
	import {
		defaultConfigX01,
		getInitialPlayers,
		type CurrentTurnX01,
		type LegX01,
		type PlayerX01,
		type SetX01,
		type UndoSnapshotX01,
		GOAL_OPTIONS,
		isSelectedGoal,
		type X01Draft,
		hasInvalidPlayers
	} from '$lib/types/useX01';
	import { PlayerManager } from '$lib/components';
	import { Calculator, Target } from '@lucide/svelte';

	let { data } = $props();

	let config = $state(defaultConfigX01);

	// Game definition
	let players = $derived<PlayerX01[]>(getInitialPlayers(data.activePlayers ?? []));
	let currentTurn = $derived<CurrentTurnX01>({
		player: getInitialPlayers(data.activePlayers ?? [])[0],
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

	const currentPlayer = $derived(data.activePlayers.find((p) => p.id === currentTurn.player.id));

	let gameStartedAtRef = new Date().toISOString();
	let hasSavedGameRef = false;
	let ready = $state(false);
	let showResumeBanner = $state(false);
	let manualScorer = $state(false);
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
			currentScore = draft.currentScore;
			busted = draft.busted;

			const currentPlayerFromDraft =
				draft.players.find((p) => p.id === draft!.currentTurn.player.id) ?? draft.players[0];

			if (currentPlayerFromDraft) {
				currentTurn = {
					player: currentPlayerFromDraft,
					throws: draft.currentTurn.throws
				};
			}

			showResumeBanner = true;
		}
	});

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
					playerId: finishedPlayer?.id || 0,
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
			player: readyPlayers[0],
			throws: []
		};

		const gameDraft: X01Draft = {
			startedAt,
			ready: true,
			manualScorer,
			config,
			players: readyPlayers,
			currentTurn: {
				player: readyPlayers[0],
				throws: []
			},
			currentScore: config.goal,
			busted: false,
			currentLeg,
			currentSet,
			sets
		};

		formData.set('gameDraft', JSON.stringify(gameDraft));
	};
</script>

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
				<form action="?/deleteGameDraft" method="POST" class="w-full">
					<Button variant="secondary" type="submit">New Game</Button>
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
		 <div class="flex flex-col px-2 gap-2 md:m-auto md:h-full">
      <div class="flex-row flex md:flex-row justify-between md:w-2/3 md:m-auto md:px-4">
        <div class="turn-strip flex-row flex md:flex-row justify-between w-full md:m-auto">
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
            <h2 class="w-fit text-2xl font-bold text-center inline-flex gap-2 items-center">
              {#if currentPlayer?.photoPath}
                <img
                  src={currentPlayer.photoPath}
                  alt={currentPlayer?.name}
                  class="h-12 w-12 rounded-full object-cover border border-border"
                />
              {/if}
              {currentPlayer?.name}
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <Button
              variant="default"
              class="border border-accent h-10 w-10"
              onClick={() => setManualScorer(!manualScorer)}
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
          headerValue={currentScore}
          throws={currentTurn.throws}
          values={Array.from({ length: 20 }, (_, index) => ({
            score: index + 1,
            label: String(index + 1),
          }))}
          onThrow={(score, multiplier) => {
            if (
              currentTurn.throws.length >= 3 ||
              busted ||
              currentPlayer?.score === 0
            ) {
              return;
            }

            captureUndoSnapshot();
            const totalPoints = score * multiplier;

            setCurrentTurn((prev) => ({
              ...prev,
              throws: [...prev.throws, { score, multiplier }],
            }));

            if (
              multiplier !== 2 &&
              config.doublein &&
              currentScore === config.goal
            ) {
              return;
            }

            currentScore = currentScore - totalPoints;
            if (currentScore < 0)
              return busted = true;
            if (config.doubleout && currentScore === 1) {
              return busted = true;
            }

            if (currentScore - totalPoints === 0) {
              if (config.doubleout && multiplier !== 2)
                return busted = true;
              const winnerId = currentTurn.player.id;

              players = (prevPlayers) =>
                prevPlayers.map((player) =>
                  player.id === currentTurn.player.id
                    ? { ...player, score: 0 }
                    : player,
                );

              const finishedLeg = {
                ...currentLeg,
                winnerId,
                history: [
                  ...currentLeg.history,
                  {
                    throws: [...currentTurn.throws, { score, multiplier }],
                    playerId: currentTurn.player.id,
                  },
                ],
              };

              const legsWonByPlayer =
                currentSet.legs.filter((l) => l.winnerId === winnerId)
                  .length + 1;
              const setWon = legsWonByPlayer === config.legs;

              if (setWon) {
                const finishedSet: SetX01 = {
                  winnerId,
                  legs: [...currentSet.legs, finishedLeg],
                };

                const setsWonByPlayer =
                  sets.filter((s) => s.winnerId === winnerId).length + 1;
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
          }}
          onMiss={() => {
            if (
              currentTurn.throws.length >= 3 ||
              busted ||
              currentPlayer?.score === 0
            ) {
              return;
            }

            captureUndoSnapshot();
            currentTurn = {
              ...currentTurn,
              throws: [...currentTurn.throws, { score: 0, multiplier: 1 }],
            };
          
          onUndo={handleDeleteLast}
          isError={busted}
          throwSelectionLocked={
            busted ||
            currentTurn.throws.length >= 3 ||
            currentPlayer?.score === 0
          }
          hint="Next player is automatic after 3 darts or a bust. Use Undo to go back."
          renderThrowValue={(throwValue) =>
            throwValue.score * throwValue.multiplier
          }
          statsSection={
            <GameStatSection
              sets={sets}
              currentLeg={currentLeg}
              players={players}
              currentSet={currentSet}
              config={config}
              currentTurn={currentTurn}
            />
          }
        />
      {:else}
        <X01BoardScorer
          game={game}
          config={config}
          statsSection={
            <GameStatSection
              sets={sets}
              currentLeg={currentLeg}
              players={players}
              currentSet={currentSet}
              config={config}
              currentTurn={currentTurn}
            />
          }
        />
      {/if}
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
