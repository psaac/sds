<script lang="ts">
	import { Avatar, Image } from '$lib/components/ui/avatar';
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
	import { listPlayerPhotos, type PlayerPhotoMap } from '$lib/types/playerPhotos';

	type ManagedPlayer = {
		id: string;
		name: string;
	};

	type PlayerOption = {
		id: string;
		name: string;
	};

	let { players, availablePlayers, onAddPlayer, onUpdatePlayerName, helperText, onRemovePlayer } =
		$props();

	const assignedNames = players.map((player: ManagedPlayer) => player.name);
	const unassignedPlayers = availablePlayers.filter(
		(player: PlayerOption) => !assignedNames.includes(player.name)
	);
	const availablePlayersByName = new Map(
		availablePlayers.map((player: PlayerOption) => [player.name, player])
	);

	let playerPhotos = $state<PlayerPhotoMap>({});
	const getPhotoForName = (name: string) => {
		const playerId = availablePlayersByName.get(name)?.id;
		return playerId ? playerPhotos[playerId] : undefined;
	};

	const isTakenByOther = (availablePlayer: PlayerOption, player: ManagedPlayer) =>
		availablePlayer.name !== player.name && assignedNames.includes(availablePlayer.name);
</script>

<div class="mt-2 flex w-full flex-col gap-2">
	<h2 class="inline-flex justify-between text-xl font-semibold">
		Players
		<Button
			aria-label="Add Player"
			size="icon-sm"
			variant="outline"
			disabled={unassignedPlayers.length === 0}
			onclick={() => {
				if (unassignedPlayers.length === 0) {
					return;
				}

				onAddPlayer(unassignedPlayers[0].name);
			}}
		>
			<Plus />
		</Button>
	</h2>
	{#if availablePlayers.length === 0}
		<p class="text-sm text-muted-foreground">
			No active players found. Create players in /players first.
		</p>
	{/if}
	{#if helperText}
		<p class="text-sm text-muted-foreground">{helperText}</p>
	{/if}
	{#each players as player}
		<div class="inline-flex items-center gap-2">
			<Avatar aria-label={player.name}>
				<Image
					src={getPhotoForName(player.name)}
					alt={player.name}
					class="rounded-full"
					width={32}
					height={32}
				/>
			</Avatar>
			<Select
				type="single"
				// value={player.name}
				// onValueChange={(value) => {
				// 	onUpdatePlayerName(player.id, value);
				// }}
				bind:value={players[index]}
			>
				<SelectTrigger class="w-full max-w-48">
					<!-- <SelectValue placeholder="Select player">{player.name}</SelectValue> -->
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Choose a player</SelectLabel>
						{#each availablePlayers as availablePlayer, index}
							<SelectItem value={availablePlayer.name} disabled={isTakenByOther}>
								<span class="inline-flex items-center gap-2">
									<Avatar>
										<Image
											src={playerPhotos[availablePlayer.id]}
											alt={availablePlayer.name}
											class="rounded-full"
											width={24}
											height={24}
										/>
									</Avatar>
									<span>{availablePlayer.name}</span>
								</span>
							</SelectItem>
						{/each}
					</SelectGroup>
				</SelectContent>
			</Select>
			<!-- {renderPlayerExtras?.(player)} -->
			<Button
				aria-label="Remove Player"
				size="icon-sm"
				variant="ghost"
				onclick={() => {
					onRemovePlayer(player.id);
				}}
			>
				<X />
			</Button>
		</div>
	{/each}
</div>
