<script lang="ts">
	import { SDSLogo, Github } from '$lib/assets';
</script>

<footer class="mt-5 flex flex-col">
	<p class="inline-flex items-center justify-center gap-2 text-muted-foreground">
		<span
			class="h-5 w-5"
			style="display:inline-block;width:20px;height:20px;line-height:0;"
			role="img"
			aria-label="Github"
		>
			{@html Github}
		</span>{' '}
		<a href="https://github.com/psaac/sds" class="underline"> Contribute on GitHub </a>
		-{' '}
		<a href="/about" class="underline"> About </a>
	</p>

	<div class="mt-4 inline-flex items-center justify-center gap-2">
		<p class="mt-2 text-xs text-muted-foreground/80">
			Version {__APP_VERSION__}
		</p>
	</div>
</footer>
