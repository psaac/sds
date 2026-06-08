<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/sdslogo.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { Header, Footer } from '$lib/components';
	import { SDSLogo, Github } from '$lib/assets';

	let { children } = $props();
	let currentIcon = $state(SDSLogo);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Header icon={currentIcon} />
{@render children()}
<Footer />
