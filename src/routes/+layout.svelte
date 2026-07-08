<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/sdslogo.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Header, Footer } from '$lib/components';
	import { SDSLogo } from '$lib/assets';
	import { page } from '$app/state';

	let { children } = $props();
	let currentIcon = $state(SDSLogo);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Header icon={currentIcon} title={page.data.title} />
{@render children()}
<Footer />
