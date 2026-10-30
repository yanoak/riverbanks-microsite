<script lang="ts">
	import { onMount } from 'svelte';
	import { EDITION } from '$lib/comic/edition';
	import { CROP, MARKERS, onMap, type Point } from '$lib/comic/map';

	const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

	// Placement mode: `/?place` in `npm run dev` only. Markers drag, and Copy positions gives the
	// MARKERS object for `map.ts`.
	let placing = $state(false);
	let at = $state<Record<number, Point>>({ ...MARKERS });
	let copied = $state(false);
	let box: HTMLElement;

	const marks = $derived(onMap(EDITION, at, CROP));

	/** The dot's text: "Start here" on the first chapter, the act numeral, "Epi" on the last. */
	function short(i: number): string {
		if (i === 0) return 'Start here · Prologue';
		if (i === EDITION.chapters.length - 1) return 'Epi';
		return NUMERALS[i - 1];
	}

	function toMap(e: PointerEvent): Point {
		const r = box.getBoundingClientRect();
		return {
			x: Math.round(CROP.x + ((e.clientX - r.left) / r.width) * CROP.w),
			y: Math.round(CROP.y + ((e.clientY - r.top) / r.height) * CROP.h)
		};
	}

	let dragging: number | null = null;
	function grab(e: PointerEvent, first: number) {
		if (!placing) return;
		e.preventDefault();
		dragging = first;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function drag(e: PointerEvent) {
		if (dragging !== null) at[dragging] = toMap(e);
	}
	function nudge(e: KeyboardEvent, first: number) {
		if (!placing) return;
		const step = e.shiftKey ? 10 : 1;
		const d = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step]
		}[e.key];
		if (!d) return;
		e.preventDefault();
		at[first] = { x: at[first].x + d[0], y: at[first].y + d[1] };
	}
	async function copy() {
		const lines = Object.entries(at).map(([k, p]) => `\t${k}: { x: ${p.x}, y: ${p.y} }`);
		await navigator.clipboard.writeText(`{\n${lines.join(',\n')}\n}`);
		copied = true;
	}

	onMount(() => {
		placing = import.meta.env.DEV && new URLSearchParams(location.search).has('place');
	});
</script>

<svelte:window onpointermove={drag} onpointerup={() => (dragging = null)} />

<div class="sea">
	<div class="map" class:placing bind:this={box} style:aspect-ratio="{CROP.w} / {CROP.h}">
		<img
			src="/map/sunda-landmass.svg"
			alt=""
			style:width="{(1000 / CROP.w) * 100}%"
			style:left="{(-CROP.x / CROP.w) * 100}%"
			style:top="{(-CROP.y / CROP.h) * 100}%"
		/>
		<p class="label" aria-hidden="true">The Sunken Continent</p>

		{#if placing}
			<div class="place-bar">
				Placing markers · drag them, or arrow keys
				<button onclick={copy}>{copied ? '✓ Copied' : 'Copy positions'}</button>
			</div>
		{/if}

		{#each marks as m, i (m.first)}
			<a
				class="marker"
				class:start={i === 0}
				href="/p/{m.first}"
				style:left="{m.left}%"
				style:top="{m.top}%"
				aria-label="{m.title}, from page {m.first}"
				onpointerdown={(e) => grab(e, m.first)}
				onkeydown={(e) => nudge(e, m.first)}
				onclick={(e) => placing && e.preventDefault()}
				draggable="false"
			>
				<span class="dot" aria-hidden="true"></span>
				<span class="name" aria-hidden="true">{short(i)}</span>
			</a>
		{/each}
	</div>
</div>

<style>
	/* The map keeps the crop's shape, so the markers stay on the land; on a wide screen it is
	   capped by height and the sea runs on either side. */
	.sea {
		background: #a9cac4;
	}
	.map {
		position: relative;
		overflow: hidden;
		width: min(100%, 62svh * 456 / 356);
		margin-inline: auto;
		touch-action: manipulation;
	}
	.map img {
		position: absolute;
		max-width: none;
		height: auto;
		pointer-events: none;
		user-select: none;
	}
	.label {
		position: absolute;
		top: 1rem;
		left: 1rem;
		font-family: var(--font-label);
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #1d2a33;
	}
	.marker {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		/* The dot's centre sits on the point. */
		translate: -0.6rem -50%;
		padding: 0.4rem 0;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	.dot {
		flex: none;
		width: 1.2rem;
		height: 1.2rem;
		border: 2px solid var(--color-ink);
		border-radius: 50%;
		background: var(--color-signal);
		animation: glow 2.4s ease-in-out infinite;
	}
	.start .dot {
		width: 1.5rem;
		height: 1.5rem;
		border-width: 3px;
	}
	.start {
		translate: -0.75rem -50%;
	}
	/* A halo, so a label still reads where it crosses a coast or a river. */
	.name {
		text-shadow:
			0 0 2px var(--color-paper),
			0 0 4px var(--color-paper),
			0 0 6px var(--color-paper);
	}
	.start .name {
		text-shadow: none;
		border-radius: 0.25rem;
		background: var(--color-ink);
		color: var(--color-paper);
		padding: 0.3rem 0.65rem;
	}
	.marker:hover .dot,
	.marker:focus-visible .dot {
		scale: 1.15;
	}
	.marker:focus-visible {
		outline: none;
	}
	.marker:focus-visible .dot {
		outline: 3px solid var(--color-ink);
		outline-offset: 3px;
	}
	@keyframes glow {
		0%,
		100% {
			box-shadow:
				0 0 0 5px rgb(238 255 65 / 0.3),
				0 0 18px 6px rgb(238 255 65 / 0.45);
		}
		50% {
			box-shadow:
				0 0 0 7px rgb(238 255 65 / 0.4),
				0 0 30px 12px rgb(238 255 65 / 0.65);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none;
			box-shadow:
				0 0 0 6px rgb(238 255 65 / 0.35),
				0 0 24px 9px rgb(238 255 65 / 0.55);
		}
	}

	.placing .marker {
		cursor: grab;
		touch-action: none;
	}
	.place-bar {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		background: var(--color-ink);
		color: var(--color-paper);
		padding: 0.5rem 1rem;
		font-family: var(--font-sans);
		font-size: 0.9rem;
	}
	.place-bar button {
		border-radius: 999px;
		background: var(--color-signal);
		color: var(--color-ink);
		padding: 0.35rem 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}
</style>
