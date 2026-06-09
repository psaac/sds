<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import {
		useX01Game,
		type ConfigX01,
		type CurrentTurnX01,
		type LegX01,
		type PlayerX01,
		type SetX01
	} from '$lib/hooks/useX01Game';
	import { PlayerManager } from '$lib/components';

	let { data } = $props();

	type GoalOption = 301 | 501 | 701 | 1001;

	const GOAL_OPTIONS = [301, 501, 701, 1001] as const satisfies readonly GoalOption[];

	const isSelectedGoal = (goal: GoalOption, config: ConfigX01) => goal === config.goal;

	const defaultConfig: ConfigX01 = {
		goal: 501,
		doubleout: false,
		doublein: false,
		legs: 1,
		sets: 1
	};
	let config = $state<ConfigX01>(defaultConfig);
	let gamePlayers = $state([]);
</script>

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
	// gamePlayers={game.players}
	{gamePlayers}
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
