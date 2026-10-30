<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { EDITION } from '$lib/comic/edition';
	import { badge, split } from '$lib/comic/chapters';
	import { bounds, frame, layout, MARKERS } from '$lib/comic/map';
	import { intro } from '$lib/content/intro';
	import { GET_INVOLVED_URL } from '$lib/site';
	import MapStage from '$lib/components/MapStage.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
	import introMd from '../content/intro.md?raw';

	let { data } = $props();

	const title = 'Riverbanks';
	const description =
		'Riverbanks, a climate fiction series by Seapunk Studios about ecoarchic institutions. Read the Premiere Edition of Volume I online.';

	// Sam's intro, verbatim; "reach out … here" goes to the get-involved form. Its closing licence
	// line is left out: the licence line at the end of the panel says it.
	const paragraphs = intro(introMd, GET_INVOLVED_URL).filter((p) => !p.startsWith('©'));
	const fold = paragraphs.slice(0, 2);
	const rest = paragraphs.slice(2);
	const start = `/p/${EDITION.chapters[0].first}`;

	// Until the page has measured itself (and when prerendered), assume a laptop.
	let vw = $state(1440);
	let vh = $state(900);
	let headerHeight = $state(72);
	let panel: HTMLElement;
	let edge = $state({ right: 516, top: 900 });
	let measured = $state(false);
	let hot = $state<number | null>(null);

	const mode = $derived(layout(vw, vh));
	const box = bounds(MARKERS, 35);
	// The map frames the markers in the space the header and the panel leave.
	const framed = $derived.by(() => {
		const free =
			mode === 'side'
				? {
						x: edge.right + 24,
						y: headerHeight + 24,
						w: vw - edge.right - 48,
						h: vh - headerHeight - 48
					}
				: { x: 16, y: headerHeight + 16, w: vw - 32, h: edge.top - headerHeight - 32 };
		return frame(
			{ w: vw, h: vh },
			{ ...free, w: Math.max(free.w, 80), h: Math.max(free.h, 80) },
			box
		);
	});

	function measure() {
		const r = panel.getBoundingClientRect();
		edge = { right: r.right, top: r.top };
		vw = window.innerWidth;
		vh = window.innerHeight;
		measured = true;
	}

	onMount(() => {
		const seen = new ResizeObserver(measure);
		seen.observe(panel);
		window.addEventListener('resize', measure);
		// The header's Chapters link: land on the list, not the top of the panel.
		const toChapters = async () => {
			if (location.hash !== '#chapters') return;
			await tick();
			panel.querySelector<HTMLElement>('.chapter')?.focus();
		};
		toChapters();
		window.addEventListener('hashchange', toChapters);
		return () => {
			seen.disconnect();
			window.removeEventListener('resize', measure);
			window.removeEventListener('hashchange', toChapters);
		};
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.origin} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="{data.origin}/og.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="The Riverbanks posters and a page of the comic" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#f3ecdc" />
</svelte:head>

<div class="landing" class:measured>
	<MapStage frame={framed} width={vw} compact={vw < 600} bind:hot />
	<SiteHeader overlay bind:height={headerHeight} />

	<section class="panel {mode}" bind:this={panel} aria-labelledby="title">
		<p class="kicker">Seapunk Studios presents</p>
		<h1 id="title">Riverbanks</h1>
		{#each fold as p, i (i)}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own intro.md, escaped by intro() -->
			<p class="welcome">{@html p}</p>
		{/each}

		<div class="ctas">
			<a class="btn" href={start}>Start reading →</a>
			<a class="btn ghost" href={GET_INVOLVED_URL} target="_blank" rel="noopener">Get involved ↗</a>
		</div>

		<h2 class="label" id="chapters">
			Chapters<span class="hint">
				· {mode === 'side' ? 'hover' : 'tap'} to find them on the map</span
			>
		</h2>
		<ol class="chapters" aria-labelledby="chapters">
			{#each EDITION.chapters as c, i (c.first)}
				{@const t = split(c.title)}
				<li>
					<a
						class="chapter"
						class:hot={hot === c.first}
						href="/p/{c.first}"
						onpointerenter={() => (hot = c.first)}
						onpointerleave={() => (hot = null)}
						onfocus={() => (hot = c.first)}
						onblur={() => (hot = null)}
					>
						<span class="badge" aria-hidden="true">{badge(i)}</span>
						<span class="name"
							><strong>{t.name}</strong>{#if t.sub}<span class="sub">{` · ${t.sub}`}</span
								>{/if}</span
						>
						<span class="page">p{c.first}</span>
					</a>
				</li>
			{/each}
		</ol>

		<div class="more">
			{#each rest as p, i (i)}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own intro.md, escaped by intro() -->
				<p>{@html p}</p>
			{/each}
		</div>

		<p class="licence">
			Riverbanks Volume I · BKKCAW26 Premiere Edition · CC BY-NC, Seapunk Studios &amp;
			collaborators 2026 · <a href="/credits">Credits</a> ·
			<a href="https://seapunk.asia" target="_blank" rel="noopener">seapunk.asia</a>
		</p>
	</section>
</div>

<style>
	.landing {
		position: fixed;
		inset: 0;
		overflow: hidden;
		background: #a9cac4;
		color: var(--color-ink);
		font-family: var(--font-sans);
	}
	/* Markers wait for the page to measure itself, so they don't jump on a phone. */
	.landing :global(.marker) {
		opacity: 0;
		transition: opacity 0.3s;
	}
	.landing.measured :global(.marker) {
		opacity: 1;
	}

	.panel {
		position: absolute;
		z-index: 5;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		overflow-y: auto;
		overscroll-behavior: contain;
		background: rgb(243 236 220 / 0.88);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 10px 40px rgb(28 25 23 / 0.18);
		line-height: 1.5;
	}
	.panel.side {
		top: calc(4.5rem + 2rem);
		bottom: 2rem;
		left: 2rem;
		width: 29rem;
		padding: 2rem 1.9rem;
		border-radius: 1rem;
	}
	.panel.bottom {
		right: 1.5rem;
		bottom: 1.5rem;
		left: 1.5rem;
		max-height: 48vh;
		max-height: 48svh;
		padding: 1.75rem 1.75rem 1.5rem;
		border-radius: 1.1rem;
	}

	/* The panel scrolls; nothing in it should shrink to fit instead. */
	.panel > :global(*) {
		flex-shrink: 0;
	}
	.kicker {
		font-family: var(--font-label);
		font-size: 0.875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-teal);
	}
	h1 {
		margin: -0.2rem 0 0;
		font-family: var(--font-display);
		font-size: 3.75rem;
		font-weight: 400;
		line-height: 0.95;
		text-transform: uppercase;
	}
	.welcome,
	.more p {
		font-size: 1.0625rem;
	}
	.panel p :global(a) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.ctas {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 0.25rem;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		min-height: 3rem;
		padding: 0 1.4rem;
		border: 2px solid var(--color-ink);
		border-radius: 999px;
		background: var(--color-ink);
		color: var(--color-paper);
		font-size: 1.0625rem;
		font-weight: 600;
		text-decoration: none;
	}
	.btn.ghost {
		background: var(--color-signal);
		color: var(--color-ink);
	}

	.label {
		margin-top: 0.75rem;
		font-family: var(--font-label);
		font-size: 0.8rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #57534e;
	}
	.chapters {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0 -0.6rem;
	}
	.chapter {
		display: grid;
		grid-template-columns: 2.1rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.45rem 0.6rem;
		border-radius: 0.5rem;
		color: inherit;
		text-decoration: none;
		transition: background 0.15s;
	}
	.chapter.hot {
		background: rgb(28 25 23 / 0.08);
	}
	.badge {
		display: grid;
		width: 1.65rem;
		height: 1.65rem;
		place-items: center;
		border: 2px solid var(--color-ink);
		border-radius: 50%;
		background: var(--color-signal);
		font-size: 0.7rem;
		font-weight: 600;
	}
	.name strong {
		font-weight: 600;
	}
	.page {
		font-size: 0.8rem;
		color: #57534e;
	}
	.more {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin-top: 0.75rem;
		padding-top: 1rem;
		border-top: 1px solid rgb(28 25 23 / 0.15);
	}
	.licence {
		font-size: 0.8rem;
		font-weight: 300;
		color: #44403c;
	}
	.licence a {
		color: inherit;
	}
	.btn:focus-visible,
	.chapter:focus-visible,
	.panel a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 2px;
	}

	/* Bottom panel: the chapters as two columns of buttons. */
	.bottom .chapters {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin: 0;
	}
	.bottom .chapter {
		grid-template-columns: auto 1fr;
		gap: 0.6rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.75rem 0.35rem 0.5rem;
		background: rgb(28 25 23 / 0.06);
		font-size: 0.95rem;
		line-height: 1.25;
	}
	.bottom .chapter.hot {
		background: rgb(28 25 23 / 0.14);
	}
	.bottom .page {
		display: none;
	}
	.bottom h1 {
		font-size: 3.25rem;
	}

	/* Phone: a sheet along the bottom edge, the chapters as a row of chips that scrolls. */
	@media (max-width: 599px) {
		.panel.bottom {
			right: 0;
			bottom: 0;
			left: 0;
			max-height: 46svh;
			gap: 0.7rem;
			padding: 1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
			border-radius: 1.25rem 1.25rem 0 0;
		}
		.bottom h1 {
			font-size: 2.6rem;
		}
		.welcome,
		.more p {
			font-size: 1rem;
		}
		.ctas .btn {
			flex: 1 1 0;
			justify-content: center;
			padding: 0 0.75rem;
			font-size: 1rem;
		}
		/* The second paragraph waits below the chapters, so the sheet's first screen is the
		   title, the welcome, the two buttons and the chips. */
		.welcome + .welcome {
			order: 1;
		}
		.more,
		.licence {
			order: 2;
		}
		.bottom .chapters {
			display: flex;
			flex-direction: row;
			gap: 0.5rem;
			margin: 0 -1.25rem;
			padding: 0 1.25rem 0.25rem;
			overflow-x: auto;
			scrollbar-width: none;
		}
		.bottom .chapters li {
			flex: none;
		}
		.bottom .chapter {
			border-radius: 999px;
			white-space: nowrap;
		}
		.bottom .sub,
		.label .hint {
			display: none;
		}
	}
</style>
