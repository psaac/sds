<script lang="ts">
	import { HeaderNav } from '$lib/components';
	//   export let backTo: string;
	//   export let title: string;
	let { description = '', backTo = '/', title = '', children } = $props();
</script>

<div class="mx-auto flex w-full flex-col items-center justify-center gap-4 p-4 sm:p-6 md:w-2/3">
	<HeaderNav {backTo} {title} desc={description} />
	{@render children()}
</div>
