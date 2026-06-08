<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';

	let { href = '/' } = $props();
</script>

<Button variant="outline" size="icon-lg" {href}>
	<ArrowLeft className="size-4" />
</Button>
