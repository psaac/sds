<script lang="ts">
	import { Divider } from '$lib/components';
	let { players, currentTurn, config, currentSet, currentLeg, sets } = $props();
	let throwCount = $derived(
		currentLeg.history
			.filter((p: any) => p.playerId === currentTurn.playerId)
			.map((t: any) => t.throws.length)
			.reduce((pV: any, cV: any) => (pV += cV), 0)
	);
</script>

<div class="w-full">
	<div class="flex flex-col gap-2 text-2xl">
		<ol>
			{#each players as p (p.id)}
				<li class={currentTurn.playerId === p.id ? 'text-accent' : ''}>
					<span class="font-semibold">{p.name}</span>: {p.score}pts
				</li>
			{/each}
		</ol>
	</div>
	<Divider class="my-2 block md:hidden" />
	<div class="flex flex-col gap-2">
		<h3 class="text-2xl">Your Stats:</h3>
		<div class="flex flex-row justify-between">
			<div class="flex w-full flex-col">
				<p>
					Points Per Dart:{' '}
					{#if throwCount === 0}
						N/A
					{:else}
						{((config.goal - currentTurn.score) / throwCount).toFixed(2)}
					{/if}
				</p>
				<p>Darts Thrown: {throwCount}</p>
			</div>
			<div class="flex w-full flex-col">
				{#if config.legs > 1 || config.sets > 1}
					<p>
						Legs Won:{' '}
						{currentSet.legs.filter((l: any) => l.winnerId === currentTurn.playerId).length}
					</p>
					<p>
						Sets Won:{' '}
						{sets.filter((s: any) => s.winnerId === currentTurn.playerId).length}
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
