<script lang="ts">
	import { onMount } from 'svelte';
	import { CLIPS, pickNext, videoFormat, type Clip } from '$lib/taro/clips';

	let { label }: { label: string } = $props();

	// Until a clip is actually playing, the poster (idle's first frame, which every clip starts
	// and ends on) stands in. With reduced motion, or if the browser refuses to autoplay, it
	// simply stays.
	let format = $state<'mp4' | 'webm' | null>(null);
	let shown = $state<Clip | null>(null);
	let current: Clip = 'idle';
	let lastAccent: Clip | null = null;
	const videos: Partial<Record<Clip, HTMLVideoElement>> = {};

	function play(next: Clip) {
		const video = videos[next];
		if (!video) return;
		video.currentTime = 0;
		// Swap only once the next clip is really playing; until then the previous clip holds its
		// last frame, which is the same picture, so a slow start never shows as a gap.
		video.addEventListener('playing', () => (shown = next), { once: true });
		video.play().catch(() => {});
		if (next !== 'idle') lastAccent = next;
		current = next;
	}

	onMount(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		format = videoFormat(navigator.userAgent);
	});

	$effect(() => {
		if (format && videos.idle) play('idle');
	});
</script>

<div class="stage" role="img" aria-label={label}>
	<img src="/taro/poster.webp" alt="" class:on={shown === null} width="720" height="720" />
	{#if format}
		{#each CLIPS as clip (clip)}
			<video
				bind:this={videos[clip]}
				src="/taro/{clip}.{format}"
				muted
				playsinline
				preload="auto"
				class:on={shown === clip}
				onended={() => play(pickNext({ current, lastAccent }, Math.random()))}
			></video>
		{/each}
	{/if}
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
	}
	img,
	video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
	}
	.on {
		opacity: 1;
	}
</style>
