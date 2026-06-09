<script lang="ts">
	import { enhance } from '$app/forms';
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
	import { Webcam } from '$lib/components';
	import { getInitials, type Player } from '$lib/types/player';

	let { data } = $props();
	const players = $derived<Player[]>(data.players);
	let saving = $state(false);
	let newPlayerName = $state('');
	let cameraTargetPlayer = $state<Player | null>(null);
	let cameraOpen = $state(false);
	let cameraPermissionError = $state<string | null>(null);
	let capturedPhoto = $state<string | null>(null);

	const handleOpenCamera = (player: Player) => {
		cameraTargetPlayer = player;
		capturedPhoto = player.photoPath ?? null;
		cameraOpen = true;
	};

	const closeCamera = () => {
		cameraOpen = false;
		cameraTargetPlayer = null;
	};

	const handleEnhancedSubmit = () => {
		saving = true;

		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			saving = false;
		};
	};

	const handleEnhancedCameraSubmit = () => {
		saving = true;
		closeCamera();

		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			saving = false;
			capturedPhoto = null;
		};
	};

	const handleEnhancedCreateSubmit = () => {
		saving = true;

		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			saving = false;
			newPlayerName = '';
		};
	};

	let capture: (() => void) | undefined = $state();
</script>

{#if saving}
	<div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
		<div
			class="flex items-center gap-2 rounded-md border bg-background px-4 py-3 text-sm shadow-lg"
		>
			<RotateCw class="h-5 w-5 animate-spin" />
			<span>Saving...</span>
		</div>
	</div>
	<div class="fixed inset-0 z-40 bg-background/40 backdrop-blur-[1px]"></div>
{/if}

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">New player</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-3">
			<form
				method="POST"
				class="flex w-full items-center gap-2"
				action="?/post"
				use:enhance={handleEnhancedCreateSubmit}
			>
				<Input
					id="player-name"
					name="name"
					placeholder="Ex: Alice"
					aria-label="New player name"
					bind:value={newPlayerName}
				/>
				<Button disabled={saving || !newPlayerName.trim()}>Create</Button>
			</form>
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
									<div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
										{#if player.photoPath}
											<img
												src={player.photoPath}
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
									</div>
								</Button>

								<div class="flex flex-col">
									<span class="font-medium">{player.name}</span>
									<span class="text-xs text-muted-foreground">
										{player.active ? 'Active' : 'Disabled'}
									</span>
								</div>
							</div>

							<div class="flex items-center gap-2">
								<form
									method="POST"
									action="?/uploadPhoto"
									enctype="multipart/form-data"
									use:enhance={handleEnhancedSubmit}
								>
									<Input type="hidden" name="playerId" value={player.id} />
									<Input
										id={`player-photo-${player.id}`}
										name="photo"
										type="file"
										accept="image/*"
										class="hidden"
										disabled={saving}
										onchange={(event: Event) => {
											const input = event.currentTarget as HTMLInputElement;
											if (input.files?.length) {
												input.form?.requestSubmit();
											}
										}}
									/>
									<Button type="button" variant="outline" disabled={saving} size="icon-lg">
										<label for={`player-photo-${player.id}`}>
											<Import />
										</label>
									</Button>
								</form>
								<form
									method="POST"
									action="?/togglePlayer"
									class="inline"
									use:enhance={handleEnhancedSubmit}
								>
									<Input type="hidden" name="playerId" value={player.id} />
									<Input type="hidden" name="active" value={player.active} />
									<Button
										variant={player.active ? 'destructive' : 'secondary'}
										disabled={saving}
										size="icon-lg"
										type="submit"
									>
										{#if player.active}
											<UserRoundMinus />
										{:else}
											<UserRoundCheck />
										{/if}
									</Button>
								</form>
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
			closeCamera();
		}
	}}
>
	<DialogContent class="max-w-xl">
		<DialogHeader>
			<DialogTitle>
				{cameraTargetPlayer ? `Webcam for ${cameraTargetPlayer.name}` : 'Webcam'}
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
			{#if capturedPhoto}
				<form
					method="POST"
					action="?/deletePhoto"
					class="inline"
					use:enhance={handleEnhancedCameraSubmit}
				>
					<Input type="hidden" name="playerId" value={cameraTargetPlayer?.id} />
					<Button type="submit" variant="destructive" disabled={saving}>
						Delete
						<Trash2 />
					</Button>
				</form>
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
				<form
					method="POST"
					action="?/uploadPhoto"
					class="inline"
					use:enhance={handleEnhancedCameraSubmit}
				>
					<Input type="hidden" name="playerId" value={cameraTargetPlayer?.id} />
					<Input type="hidden" name="photoDataUrl" value={capturedPhoto} />

					<Button type="submit" disabled={saving}>
						Save <Save />
					</Button>
				</form>
			{:else}
				<Button onclick={() => capture?.()} disabled={Boolean(cameraPermissionError)}>
					<Camera />
				</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
