<script lang="ts">
	import { cn } from '$lib/utils';
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<div
	class={cn(className, 'h-0.5 w-full bg-linear-to-r from-transparent via-accent to-transparent')}
></div>
