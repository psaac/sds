<script lang="ts">
	let { onCapture, capture = $bindable(), class: className } = $props();

	let videoEl: HTMLVideoElement;
	let canvasEl: HTMLCanvasElement;
	let stream: MediaStream | null = null;

	async function startStream() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
			videoEl.srcObject = stream;
		} catch (err) {
			console.error('Webcam error:', err);
		}
	}

	function stopStream() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
	}

	// Exposée via la prop bindable `capture` — le parent peut appeler capture() pour déclencher la photo
	capture = () => {
		const width = videoEl.videoWidth;
		const height = videoEl.videoHeight;
		if (!width || !height) return;

		canvasEl.width = width;
		canvasEl.height = height;
		const context = canvasEl.getContext('2d') as CanvasRenderingContext2D;
		context.drawImage(videoEl, 0, 0, width, height);

		const dataUrl = canvasEl.toDataURL('image/png');
		onCapture?.(dataUrl);
	};

	$effect(() => {
		startStream();
		return () => stopStream();
	});
</script>

<section class="container mx-auto px-4">
	<canvas bind:this={canvasEl} class="hidden"></canvas>
	<video bind:this={videoEl} class={className} width="640" height="480" autoplay></video>
</section>
