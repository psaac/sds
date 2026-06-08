<script lang="ts">
	import { GamePageShell } from '$lib/components';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<GamePageShell
	description={page.data.description}
	backTo={page.data.backTo}
	title={page.data.title}
>
	{@render children()}
</GamePageShell>
