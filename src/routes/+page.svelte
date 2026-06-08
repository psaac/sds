<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { ChartArea, Calculator, Users } from '@lucide/svelte/icons';
	// import { Github } from '$lib/components/ui/github';
	import { Header } from '$lib/components';
	import { SDSLogo, Github, Cricket } from '$lib/assets';

	const links = [
		{
			href: '/games',
			title: 'Games',
			description: 'Find the game you need a scorekeeper for.',
			icon: Calculator
		},
		{
			href: '/stats',
			title: 'Stats',
			description: 'Review local players and match history.',
			icon: ChartArea
		},
		{
			href: '/players',
			title: 'Players',
			description: 'Create players and disable those you do not use.',
			icon: Users
		}
	];
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4 text-center sm:p-8">
	<h1 class="text-3xl md:text-5xl">
		Welcome to{' '}
		<span class="font-bold text-accent"> Simple Darts Scorekeeper (SDS) </span>
		!
	</h1>
	<div>
		<main class="flex flex-col gap-4">
			<p class="max-w-2xl text-balance text-muted-foreground md:mx-auto">
				<span class="text-accent">Simple Darts Scorekeeper</span> is a self-hosted web application
				designed to provide a seamless and intuitive scorekeeping experience for darts players of
				all levels. Whether you're a casual player looking to keep track of your games or a
				competitive player analyzing your performance, SDS has you covered.
				<br />
			</p>

			<Separator class="mx-auto w-full md:w-2/3" />
			<div class="mx-auto flex w-full max-w-2xl flex-col gap-3">
				{#each links as link}
					<a href={link.href}>
						<Card class="feature-card transition-colors hover:border-accent">
							<CardHeader class="pb-2">
								<CardTitle class="inline-flex items-center gap-2 text-left text-xl">
									<link.icon class="h-7 w-7 text-accent" />
									{link.title}
								</CardTitle>
							</CardHeader>
							<CardContent class="text-left text-muted-foreground">
								<p>{link.description}</p>
							</CardContent>
						</Card>
					</a>
				{/each}
			</div>
		</main>
	</div>
</div>
