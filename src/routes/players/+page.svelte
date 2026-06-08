<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import {
		Camera,
		Import,
		RotateCw,
		Save,
		Trash2,
		UserRoundCheck,
		UserRoundMinus
	} from '@lucide/svelte';
	import { getInitials } from '$lib/utils';
	import { Webcam } from '$lib/components';
	import { playersStore } from '$lib/stores/players.svelte';
	// import { playerPhotosStore } from '$lib/stores/photos.svelte';
	import { createPlayer, listPlayers, setPlayerPhoto } from '$lib/api';
	import type { Player } from '$lib/types/player';

	const players = $derived(playersStore.players);
	let saving = $state(false);
	let newPlayerName = $state('');
	let error = $state<string | null>(null);
	let cameraTargetPlayer = $state<Player | null>(null);
	let cameraOpen = $state(false);
	let cameraPermissionError = $state<string | null>(null);
	let capturedPhoto = $state<string | null>(null);

	const handleCreatePlayer = async () => {
		const name = newPlayerName.trim();
		if (!name) {
			return;
		}

		saving = true;
		error = null;

		try {
			await createPlayer(name);
			newPlayerName = '';
			// Update store with latest players list after creating a new player
			playersStore.setPlayers(await listPlayers());
		} catch {
			error = 'Could not create player';
		} finally {
			saving = false;
		}
	};

	const handleOpenCamera = (player: Player) => {
		cameraTargetPlayer = player;
		cameraOpen = true;
	};

	const handleCloseCamera = () => {
		cameraOpen = false;
		cameraTargetPlayer = null;
	};

	const handleSaveCapturedPhoto = async () => {
		if (!cameraTargetPlayer || !capturedPhoto) {
			return;
		}

		saving = true;
		error = null;

		try {
			await setPlayerPhoto(cameraTargetPlayer.id, capturedPhoto);
			// Update store with photo for the player
			// setPlayerPhotos((prev) => ({
			// 	...prev,
			// 	[cameraTargetPlayer.id]: capturedPhoto
			// }));
			// playerPhotosStore.setPhoto(cameraTargetPlayer.id, capturedPhoto);
			playersStore.updatePlayerPhoto(cameraTargetPlayer.id, capturedPhoto);
			handleCloseCamera();
		} catch {
			error = 'Could not save player photo';
		} finally {
			saving = false;
		}
	};

	let capture: (() => void) | undefined = $state();
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">New player</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-3">
			<Input
				id="player-name"
				//value={newPlayerName}
				//onchange={(event) => newPlayerName = event.currentTarget.value}
				placeholder="Ex: Alice"
				aria-label="New player name"
				bind:value={newPlayerName}
			/>
			<Button
				disabled={saving || !newPlayerName.trim()}
				onclick={() => {
					handleCreatePlayer();
				}}
			>
				Create
			</Button>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>All Players</CardTitle>
		</CardHeader>
		<CardContent class="px-2">
			{#if players.length === 0}
				<p class="text-muted-foreground">No players yet.</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each players as player}
						<div
							class="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2"
						>
							<div class="flex items-center gap-3">
								<Button
									type="button"
									class="h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border bg-muted"
									title={`Take photo for ${player.name}`}
									aria-label={`Take photo for ${player.name}`}
									onclick={() => {
										handleOpenCamera(player);
									}}
									disabled={saving}
								>
									{#if player.photoDataUrl}
										<img
											src={player.photoDataUrl}
											alt={player.name}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground"
										>
											{getInitials(player.name)}
										</div>
									{/if}
								</Button>

								<div class="flex flex-col">
									<span class="font-medium">{player.name}</span>
									<span class="text-xs text-muted-foreground">
										{player.active ? 'Active' : 'Disabled'}
									</span>
								</div>
							</div>

							<div class="flex items-center gap-2">
								<input
									id={`player-photo-${player.id}`}
									type="file"
									accept="image/*"
									class="hidden"
									disabled={saving}
								/>
								<Button
									// asChild
									variant="outline"
									disabled={saving}
									size="icon-lg"
								>
									<label for={`player-photo-${player.id}`}>
										<Import />
									</label>
								</Button>
								<Button
									variant={player.active ? 'destructive' : 'secondary'}
									disabled={saving}
									onclick={() => {
										//void handleTogglePlayer(player, !player.active);
									}}
								>
									{#if player.active}
										<UserRoundMinus />
									{:else}
										<UserRoundCheck />
									{/if}
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<Dialog
	open={cameraOpen}
	onOpenChange={(open) => {
		if (!open) {
			handleCloseCamera();
		}
	}}
>
	<DialogContent class="max-w-xl">
		<DialogHeader>
			<DialogTitle>
				{cameraTargetPlayer ? `Webcam for ${cameraTargetPlayer.id}` : 'Webcam'}
			</DialogTitle>
			<DialogDescription>
				Capture a profile photo directly from your device camera.
			</DialogDescription>
		</DialogHeader>

		<div class="overflow-hidden rounded-md border bg-black/70">
			{#if capturedPhoto}
				<img src={capturedPhoto} alt="Captured player" class="h-72 w-full object-cover" />
			{:else}
				<Webcam
					class="h-72 w-full object-cover"
					onCapture={(dataUrl: string) => {
						capturedPhoto = dataUrl;
					}}
					bind:capture
				/>
			{/if}
		</div>

		{#if cameraPermissionError}
			<p class="text-sm text-red-500">{cameraPermissionError}</p>
		{/if}

		<DialogFooter>
			<!-- {#if cameraTargetPlayer?.id && playerPhotos[cameraTargetPlayer.id]} -->
			{#if cameraTargetPlayer?.id}
				<Button
					variant="destructive"
					disabled={saving}
					onclick={() => {
						//void handleRemoveCurrentPlayerPhoto();
					}}
				>
					<Trash2 />
				</Button>
			{/if}
			{#if capturedPhoto}
				<Button
					variant="outline"
					onclick={() => {
						capturedPhoto = null;
					}}
				>
					<RotateCw />
				</Button>
				<Button disabled={saving} onclick={() => void handleSaveCapturedPhoto()}>
					<Save />
				</Button>
			{:else}
				<Button onclick={() => capture?.()} disabled={Boolean(cameraPermissionError)}>
					<Camera />
				</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
