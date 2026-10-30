<script lang="ts">
	import { onMount } from 'svelte';
	import { EDITION } from '$lib/comic/edition';
	import { MAP, MARKERS, onMap, toScreen, type Frame, type Point } from '$lib/comic/map';
	import { badge } from '$lib/comic/chapters';

	let {
		frame,
		width,
		hot = $bindable(null),
		compact = false
	}: {
		frame: Frame;
		/** The screen's width: a pill near the right edge opens leftwards. */
		width: number;
		/** The chapter (its first page) lit by hover or focus, here or in the chapter list. */
		hot?: number | null;
		/** Phones: "Start here" alone on the Prologue's pill. */
		compact?: boolean;
	} = $props();

	// Placement mode: `/?place` in `npm run dev` only. Markers drag, arrow keys nudge them, and
	// Copy positions gives the MARKERS object for `map.ts`.
	let placing = $state(false);
	let at = $state<Record<number, Point>>({ ...MARKERS });
	let copied = $state(false);

	const marks = $derived(onMap(EDITION, at).map((m, i) => ({ ...m, i, ...toScreen(m, frame) })));

	let dragging: number | null = null;
	function grab(e: PointerEvent, first: number) {
		if (!placing) return;
		e.preventDefault();
		dragging = first;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function drag(e: PointerEvent) {
		if (dragging === null) return;
		at[dragging] = {
			x: Math.round((e.clientX - frame.x) / frame.scale),
			y: Math.round((e.clientY - frame.y) / frame.scale)
		};
	}
	function nudge(e: KeyboardEvent, first: number) {
		if (!placing) return;
		const step = e.shiftKey ? 10 : 1;
		const move: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step]
		};
		const d = move[e.key];
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

<div class="stage" class:placing>
	<img
		src="/map/sunda-landmass.svg"
		alt=""
		style:left="{frame.x}px"
		style:top="{frame.y}px"
		style:width="{MAP.w * frame.scale}px"
	/>

	{#each marks as m (m.first)}
		<a
			class="marker"
			class:start={m.i === 0}
			class:hot={hot === m.first}
			class:leftward={m.left > width - 320}
			href="/p/{m.first}"
			style:left="{m.left}px"
			style:top="{m.top}px"
			aria-label="{m.title}, from page {m.first}"
			onpointerenter={() => (hot = m.first)}
			onpointerleave={() => (hot = null)}
			onfocus={() => (hot = m.first)}
			onblur={() => (hot = null)}
			onpointerdown={(e) => grab(e, m.first)}
			onkeydown={(e) => nudge(e, m.first)}
			onclick={(e) => placing && e.preventDefault()}
			draggable="false"
		>
			<span class="dot" aria-hidden="true">{badge(m.i)}</span>
			<span class="pill" aria-hidden="true"
				>{m.i === 0 ? (compact ? 'Start here' : 'Start here · Prologue') : m.title}</span
			>
		</a>
	{/each}

	{#if placing}
		<div class="place-bar">
			Placing markers · drag them, or arrow keys
			<button onclick={copy}>{copied ? '✓ Copied' : 'Copy positions'}</button>
		</div>
	{/if}
</div>

<style>
	.stage {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #a9cac4;
		touch-action: manipulation;
	}
	img {
		position: absolute;
		max-width: none;
		height: auto;
		pointer-events: none;
		user-select: none;
	}
	.marker {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		/* The dot's centre sits on the point. */
		translate: -0.95rem -50%;
		padding: 0.25rem 0;
		color: var(--color-ink);
		font-family: var(--font-sans);
		text-decoration: none;
	}
	.marker.leftward {
		flex-direction: row-reverse;
		translate: calc(-100% + 0.95rem) -50%;
	}
	.dot {
		display: grid;
		flex: none;
		width: 1.9rem;
		height: 1.9rem;
		place-items: center;
		border: 2px solid var(--color-ink);
		border-radius: 50%;
		background: var(--color-signal);
		font-size: 0.75rem;
		font-weight: 600;
		box-shadow:
			0 0 0 6px rgb(238 255 65 / 0.3),
			0 0 24px 8px rgb(238 255 65 / 0.5);
		transition:
			scale 0.15s,
			box-shadow 0.15s;
	}
	.pill {
		border-radius: 0.375rem;
		background: var(--color-ink);
		color: var(--color-paper);
		padding: 0.35rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 600;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.15s;
		pointer-events: none;
	}
	.start .pill,
	.hot .pill {
		opacity: 1;
	}
	.hot {
		z-index: 1;
	}
	.hot .dot {
		scale: 1.35;
		box-shadow:
			0 0 0 10px rgb(238 255 65 / 0.4),
			0 0 48px 18px rgb(238 255 65 / 0.75);
	}
	.marker:focus-visible {
		outline: none;
	}
	.marker:focus-visible .dot {
		outline: 3px solid var(--color-ink);
		outline-offset: 4px;
	}
	@media (prefers-reduced-motion: no-preference) {
		.dot {
			animation: breathe 2.4s ease-in-out infinite;
		}
		.hot .dot {
			animation: none;
		}
	}
	@keyframes breathe {
		50% {
			box-shadow:
				0 0 0 8px rgb(238 255 65 / 0.4),
				0 0 32px 12px rgb(238 255 65 / 0.65);
		}
	}

	.placing .marker {
		cursor: grab;
		touch-action: none;
	}
	.place-bar {
		position: absolute;
		right: 1rem;
		bottom: 1rem;
		z-index: 20;
		display: flex;
		align-items: center;
		gap: 1rem;
		border-radius: 999px;
		background: var(--color-ink);
		color: var(--color-paper);
		padding: 0.5rem 0.5rem 0.5rem 1rem;
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
