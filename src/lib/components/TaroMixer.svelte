<script lang="ts">
	import { onMount } from 'svelte';
	import { CLIPS, pickNext, videoFormat, type Clip } from '$lib/taro/clips';

	let { label }: { label: string } = $props();

	// Until a clip is actually playing, the poster (idle's first frame, which every clip starts
	// and ends on) stands in. With reduced motion, or if the browser refuses to autoplay (iOS Low
	// Power Mode does), it simply stays.
	let format = $state<'mp4' | 'webm' | null>(null);
	let shown = $state<Clip | null>(null);
	let current: Clip = 'idle';
	let lastAccent: Clip | null = null;
	const videos: Partial<Record<Clip, HTMLVideoElement>> = {};

	// Open the page with #debug to see what the browser reports, e.g. on a phone.
	let debug = $state(false);
	let events = $state<string[]>([]);
	const log = (line: string) => {
		if (debug) events = [...events.slice(-11), `${(performance.now() / 1000).toFixed(1)}s ${line}`];
	};

	function play(next: Clip) {
		const video = videos[next];
		if (!video) return log(`no element for ${next}`);
		video.currentTime = 0;
		// Swap only once the next clip is really playing; until then the previous clip holds its
		// last frame, which is the same picture, so a slow start never shows as a gap.
		video.addEventListener('playing', () => ((shown = next), log(`playing ${next}`)), {
			once: true
		});
		video.play().catch((e: Error) => log(`play ${next} refused: ${e.name} ${e.message}`));
		if (next !== 'idle') lastAccent = next;
		current = next;
	}

	/**
	 * Attached to each video as it is created. Registering here, rather than through bind:this
	 * and an effect or a load event, is what makes the start reliable: iOS Safari loads no video
	 * data before play() is called, so canplay never fires there, and bind:this can land after
	 * an effect has already run.
	 */
	function register(clip: Clip) {
		return (video: HTMLVideoElement) => {
			// WebKit lets a video play without a tap only if it is muted; set both the property and
			// the attribute it checks.
			video.muted = video.defaultMuted = true;
			video.setAttribute('muted', '');
			video.setAttribute('playsinline', '');
			videos[clip] = video;
			if (clip === 'idle') play('idle');
			return () => delete videos[clip];
		};
	}

	onMount(() => {
		debug = location.hash === '#debug';
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		format = reduced ? null : videoFormat(navigator.userAgent);
		log(`format ${format ?? 'none (reduced motion)'} · ${navigator.userAgent}`);
	});
</script>

<div class="stage" role="img" aria-label={label}>
	<img src="/taro/poster.webp" alt="" class:on={shown === null} width="720" height="720" />
	{#if format}
		{#each CLIPS as clip (clip)}
			<video
				{@attach register(clip)}
				src="/taro/{clip}.{format}"
				muted
				playsinline
				preload="auto"
				class:on={shown === clip}
				onended={() => play(pickNext({ current, lastAccent }, Math.random()))}
				onerror={(e) =>
					log(`error ${clip}: ${(e.currentTarget as HTMLVideoElement).error?.message ?? '?'}`)}
			></video>
		{/each}
	{/if}
</div>

{#if debug}
	<pre class="debug">{events.join('\n')}</pre>
{/if}

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
	.debug {
		position: fixed;
		left: 8px;
		right: 8px;
		top: 8px;
		z-index: 10;
		margin: 0;
		padding: 8px;
		max-height: 45vh;
		overflow: auto;
		font:
			11px/1.35 ui-monospace,
			monospace;
		white-space: pre-wrap;
		background: rgb(28 25 23 / 0.85);
		color: #f3ecdc;
	}
</style>
