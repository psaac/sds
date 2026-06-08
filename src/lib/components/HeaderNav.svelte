<script lang="ts">
	import { BackLink } from '$lib/components';

	let { backTo = '/', title, desc } = $props();
</script>

<header class="flex w-full items-center justify-start gap-3 text-left">
	<BackLink href={backTo} />
	<h1 class="m-0 text-3xl leading-tight font-bold sm:text-5xl">
		{title}
	</h1>
</header>
{#if desc}
	<p class="w-full text-left text-muted-foreground">{desc}</p>
{/if}
