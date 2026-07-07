<script lang="ts">
	import { CircleX, Undo2 } from '@lucide/svelte';

	import { Button } from '$lib/components/ui/button';
	import Dart from '$lib/assets/dart.svg';

	type ManualThrow = {
		score: number;
		multiplier: number;
	};

	type ManualScorerValue = {
		score: number;
		label: string;
		fixedMultiplier?: 1 | 2 | 3;
		allowedMultipliers?: Array<1 | 2 | 3>;
	};

	const BULL25_VALUE: ManualScorerValue = {
		score: 25,
		label: 'Bull',
		allowedMultipliers: [1, 2]
	};

	const MISS_VALUE: ManualScorerValue = {
		score: 0,
		label: 'Miss',
		allowedMultipliers: [1]
	};

	let selectedMultiplier = $state<2 | 3 | null>(null);

	const currentMultiplier = $derived(selectedMultiplier ?? 1);

	const getButtonMultiplier = (value: ManualScorerValue): 1 | 2 | 3 => {
		if (value.fixedMultiplier) {
			return value.fixedMultiplier;
		}

		return currentMultiplier;
	};

	const isValueDisabled = (value: ManualScorerValue) => {
		if (throwSelectionLocked) {
			return true;
		}

		if (value.fixedMultiplier) {
			return false;
		}

		if (!value.allowedMultipliers) {
			return false;
		}

		return !value.allowedMultipliers.includes(currentMultiplier);
	};

	const handleValueThrow = (value: ManualScorerValue) => {
		const multiplier = getButtonMultiplier(value);
		onThrow(value.score, multiplier);

		if (!value.fixedMultiplier && multiplier !== 1) {
			selectedMultiplier = null;
		}
	};

	const renderThrowContent = (throwValue?: ManualThrow) => {
		if (!throwValue) {
			return null;
		}

		if (renderThrowValue) {
			return renderThrowValue(throwValue);
		}

		return throwValue.score * throwValue.multiplier;
	};

	type ManualScorerProps = {
		headerLabel: string;
		currentScore: number;
		throws: ManualThrow[];
		values: ManualScorerValue[];
		onThrow: (score: number, multiplier: 1 | 2 | 3) => void;
		onUndo: () => void;
		renderThrowValue?: (throwValue: ManualThrow) => number;
		isError?: boolean;
		throwSelectionLocked?: boolean;
		valuesGridClassName?: string;
		allowDouble?: boolean;
		allowTriple?: boolean;
	};

	let {
		headerLabel,
		currentScore,
		throws,
		values,
		onThrow,
		onUndo,
		renderThrowValue,
		isError = false,
		throwSelectionLocked = false,
		valuesGridClassName = 'grid grid-cols-5 gap-2',
		allowDouble = true,
		allowTriple = true
	}: ManualScorerProps = $props();
</script>

<div class="flex w-full flex-col gap-4 md:m-auto md:w-2/3 md:px-4">
	<div class={`${isError ? 'text-red-500' : ''} flex h-fit flex-row px-2`}>
		<div class="mr-4">
			<div class="flex flex-col">
				<p>{headerLabel}</p>
				<p class="text-7xl font-semibold">{currentScore}</p>
			</div>
		</div>
		<div class="dart-lane m-auto flex h-full flex-row items-center justify-center text-7xl">
			{#each [0, 1, 2] as throwIndex}
				<div class="relative flex items-center justify-center">
					{#if throws[throwIndex]}
						<p class="absolute top-auto z-10 w-full text-center text-2xl font-bold">
							{renderThrowContent(throws[throwIndex])}
						</p>
					{/if}
					<img
						src={Dart}
						class={`${throws.length >= throwIndex + 1 ? 'opacity-30' : ''} ${isError ? 'text-red-500' : 'text-accent'} h-16 w-auto`}
						alt="Dart"
					/>
				</div>
			{/each}
		</div>
	</div>

	{#if allowDouble || allowTriple}
		<div class="grid grid-cols-2 gap-2">
			<Button
				variant={selectedMultiplier === 2 ? 'default' : 'outline'}
				class="h-12 border text-base font-semibold"
				disabled={throwSelectionLocked || !allowDouble}
				onclick={() => (selectedMultiplier = selectedMultiplier === 2 ? null : 2)}
			>
				Double
			</Button>
			<Button
				variant={selectedMultiplier === 3 ? 'default' : 'outline'}
				class="h-12 border text-base font-semibold"
				disabled={throwSelectionLocked || !allowTriple}
				onclick={() => (selectedMultiplier = selectedMultiplier === 3 ? null : 3)}
			>
				Triple
			</Button>
		</div>
	{/if}

	<div class={valuesGridClassName}>
		{#each values as value}
			<Button
				variant="outline"
				class="h-12 border text-lg font-semibold"
				disabled={isValueDisabled(value)}
				onclick={() => handleValueThrow(value)}
			>
				{value.label}
			</Button>
		{/each}
	</div>

	<div class="grid grid-cols-5 gap-2">
		<Button
			variant="outline"
			class="col-span-3 h-12 border text-lg font-semibold"
			disabled={isValueDisabled(BULL25_VALUE)}
			onclick={() => handleValueThrow(BULL25_VALUE)}
		>
			{BULL25_VALUE.label}
		</Button>
		<Button
			variant="destructive"
			class="h-12"
			onclick={() => handleValueThrow(MISS_VALUE)}
			disabled={throwSelectionLocked}
		>
			<CircleX />
		</Button>
		<Button class="h-12" onclick={onUndo}>
			<Undo2 />
		</Button>
	</div>

	<div class="flex flex-row justify-center gap-2"></div>

	<p class="game-hint text-center text-sm text-muted-foreground">
		Next player is automatic after 3 darts or a bust. Use Undo to go back.
	</p>
</div>
