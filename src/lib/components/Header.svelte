<script lang="ts">
	import { MoonIcon, SunIcon } from '@lucide/svelte';
	// import { Killer } from '$lib/assets';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button';

	let { icon }: { icon: string } = $props();
</script>

<header class="flex items-center justify-between gap-3 p-4">
	<h1 class="text-text inline-flex text-xl font-semibold">
		<a href="/" class="flex flex-row gap-2 text-2xl no-underline">
			<div class="inline-flex h-full text-left">
				<span class="h-16 w-16" aria-hidden="true">
					{@html icon}
				</span>
			</div>
			<div class="flex flex-col text-left">
				<div class="text-3xl font-bold">SDS</div>
				<div class="text-sm font-medium">A simple darts scorekeeper.</div>
			</div>
		</a>
	</h1>
	<div class="inline-flex items-center gap-2">
		<Button onclick={() => toggleMode()} size="icon" variant="outline">
			<SunIcon
				class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
			/>
			<MoonIcon
				class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
			/>
			<span class="sr-only">Toggle theme</span>
		</Button>
	</div>
</header>
