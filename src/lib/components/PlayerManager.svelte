<script lang="ts">
	import { Avatar, AvatarFallback, Image } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectLabel,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Plus, X } from '@lucide/svelte';
	import { getInitials } from '$lib/types/player';

	type ManagedPlayer = {
		id: number;
		name: string;
		photoPath?: string | null;
	};

	type PlayerOption = {
		id: number;
		name: string;
		photoPath?: string | null;
	};

	const hasName = (name: string | null | undefined) => Boolean(name?.trim());

	let { gamePlayers = $bindable<ManagedPlayer[]>([]), activePlayers = [] } = $props<{
		gamePlayers?: ManagedPlayer[];
		activePlayers?: PlayerOption[];
	}>();

	const assignedNames = $derived(
		gamePlayers.map((player: ManagedPlayer) => player.name).filter((name: string) => hasName(name))
	);

	const unassignedPlayers = $derived(
		activePlayers.filter((player: PlayerOption) => !assignedNames.includes(player.name))
	);
	const availablePlayersByName = $derived(
		new Map<string, PlayerOption>(
			activePlayers.map((player: PlayerOption) => [player.name, player] as const)
		)
	);

	const getSelectablePlayers = (player: ManagedPlayer) => {
		if (!hasName(player.name)) {
			return activePlayers;
		}

		return availablePlayersByName.get(player.name)
			? activePlayers
			: [
					{
						id: player.id,
						name: player.name,
						photoPath: player.photoPath ?? null
					},
					...activePlayers
				];
	};

	const isTakenByOther = (availablePlayer: PlayerOption, player: ManagedPlayer) =>
		availablePlayer.name !== player.name && assignedNames.includes(availablePlayer.name);

	const addPlayer = () => {
		if (unassignedPlayers.length === 0) {
			return;
		}

		const nextPlayer = unassignedPlayers[0];
		const playerTemplate = gamePlayers[0];

		gamePlayers = [
			...gamePlayers,
			playerTemplate
				? {
						...playerTemplate,
						id: nextPlayer.id,
						name: nextPlayer.name,
						photoPath: nextPlayer.photoPath ?? null
					}
				: {
						id: nextPlayer.id,
						name: nextPlayer.name,
						photoPath: nextPlayer.photoPath ?? null
					}
		];
	};

	const updatePlayerName = (playerId: number, selectedName: string | undefined) => {
		if (!selectedName) {
			return;
		}

		const selectedPlayer = availablePlayersByName.get(selectedName);

		gamePlayers = gamePlayers.map((player: ManagedPlayer) =>
			player.id === playerId
				? {
						...player,
						name: selectedName,
						photoPath: selectedPlayer ? (selectedPlayer.photoPath ?? null) : null
					}
				: player
		);
	};

	const removePlayer = (playerId: number) => {
		gamePlayers = gamePlayers.filter((player: ManagedPlayer) => player.id !== playerId);
	};
</script>

<div class="mt-2 flex w-full flex-col gap-2">
	<h2 class="inline-flex justify-between text-xl font-semibold">
		Players
		<Button
			aria-label="Add Player"
			size="icon-sm"
			variant="outline"
			disabled={unassignedPlayers.length === 0}
			onclick={addPlayer}
		>
			<Plus />
		</Button>
	</h2>
	{#if activePlayers.length === 0}
		<p class="text-sm text-muted-foreground">
			No active players found. Create players in /players first.
		</p>
	{/if}

	<p class="text-sm text-muted-foreground">
		Add players to the game. Players must be created in the /players page first.
	</p>

	<div class="flex flex-col gap-2 md:flex-row">
		{#each gamePlayers as player (player.id)}
			<div class="inline-flex items-center gap-2 md:w-1/4">
				{#key `${player.name}:${player.photoPath ?? ''}`}
					<Avatar aria-label={player.name}>
						<Image
							src={player.photoPath ?? undefined}
							alt={player.name}
							class="rounded-full"
							width={32}
							height={32}
						/>
						<AvatarFallback>{getInitials(player.name)}</AvatarFallback>
					</Avatar>
				{/key}
				<Select
					type="single"
					value={player.name}
					onValueChange={(value) => updatePlayerName(player.id, value)}
				>
					<SelectTrigger class="w-full max-w-48">
						<span data-slot="select-value">{player.name}</span>
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Choose a player</SelectLabel>
							{#each getSelectablePlayers(player) as availablePlayer (availablePlayer.id)}
								<SelectItem
									value={availablePlayer.name}
									disabled={isTakenByOther(availablePlayer, player)}
								>
									<span class="inline-flex items-center gap-2">
										<Avatar>
											<Image
												src={availablePlayer.photoPath ?? undefined}
												alt={availablePlayer.name}
												class="rounded-full"
												width={24}
												height={24}
											/>
											<AvatarFallback>{getInitials(availablePlayer.name)}</AvatarFallback>
										</Avatar>
										<span>{availablePlayer.name}</span>
									</span>
								</SelectItem>
							{/each}
						</SelectGroup>
					</SelectContent>
				</Select>
				<Button
					aria-label="Remove Player"
					size="icon-sm"
					variant="ghost"
					onclick={() => removePlayer(player.id)}
				>
					<X />
				</Button>
			</div>
		{/each}
	</div>
</div>
