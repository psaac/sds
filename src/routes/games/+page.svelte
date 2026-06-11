<script lang="ts">
	import type { SupportedGameType } from '$lib/types/game';
	import { Cricket, Killer, X01, Lantern } from '$lib/assets';
	import { GameCard } from '$lib/components/ui/game';

	let inProgressGames = $state<Record<SupportedGameType, boolean>>({
		x01: false,
		cricket: false,
		killer: false,
		shanghai: false
	});
</script>

<div class="mx-auto grid w-full grid-cols-1 gap-3 md:grid-cols-2">
	<GameCard name="X01" link="x01" icon={X01} hasInProgress={inProgressGames.x01}>
		{' '}
		The classic. Choose between 1001 / 701 / 501 / 301{' '}
	</GameCard>
	<GameCard name="Cricket" link="cricket" icon={Cricket} hasInProgress={inProgressGames.cricket}>
		{' '}
		Strategy meets skill. Open a section to start scoring!{' '}
	</GameCard>
	<GameCard name="Killer" link="killer" icon={Killer} hasInProgress={inProgressGames.killer}>
		{' '}
		Eliminate your opponents.{' '}
	</GameCard>
	<GameCard name="Shanghai" link="shanghai" icon={Lantern} hasInProgress={inProgressGames.shanghai}>
		{' '}
		Score points on beds 1-7.{' '}
	</GameCard>
</div>
