<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Dot } from '@lucide/svelte';
	import { type Snippet } from 'svelte';

	let {
		name,
		link,
		icon,
		hasInProgress,
		children
	}: {
		name: string;
		link: string;
		icon: string;
		hasInProgress?: boolean;
		children: Snippet<[]>;
	} = $props();
</script>

<a href={'/games/' + link} class="w-full no-underline">
	<Card
		class="game-card border border-transparent transition-all duration-200 hover:border-accent hover:bg-accent/10 hover:shadow-lg"
	>
		<CardHeader>
			<CardTitle class="inline-flex items-center gap-2 text-xl font-bold">
				<span class="h-12 w-12 text-accent">{@html icon}</span>
				{name}
				{#if hasInProgress}
					<span title="Game in progress">
						<Dot class="h-12 w-12 fill-green-400 text-green-400" />
					</span>
				{/if}
			</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="text-md text-muted-foreground">{@render children()}</p>
		</CardContent>
	</Card>
</a>

<style>
	:global(svg) {
		max-width: 40px;
		display: block;
	}
</style>
