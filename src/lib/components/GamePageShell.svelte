<script lang="ts">
	import { HeaderNav } from '$lib/components';
	let { description = '', backTo = '/', title = '', children } = $props();
</script>

<div class="mx-auto flex w-full flex-col items-center justify-center gap-4 px-2 md:w-2/3">
	<!-- <HeaderNav {backTo} {title} desc={description} /> -->
	{@render children()}
</div>
