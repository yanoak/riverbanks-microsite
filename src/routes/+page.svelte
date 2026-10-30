<script lang="ts">
	import { EDITION, PAGES, pageSrc } from '$lib/comic/edition';
	import { intro } from '$lib/content/intro';
	import MapHero from '$lib/components/MapHero.svelte';
	import introMd from '../content/intro.md?raw';

	let { data } = $props();

	const title = 'Riverbanks';
	const description =
		'Riverbanks, a climate fiction series by Seapunk Studios about ecoarchic institutions. Read the Premiere Edition of Volume I online.';

	// The existing newsletter's signup page. Until it is set, the keep-in-touch box is hidden.
	const NEWSLETTER_URL = '';
	// Where the intro's "reach out here" goes. Until there is somewhere (F4's form), plain text.
	const REACH_OUT_URL: string | null = null;

	// Sam's intro, verbatim. Its closing licence line is left out: the licence line below says it.
	const paragraphs = intro(introMd, REACH_OUT_URL).filter((p) => !p.startsWith('©'));
	const fold = paragraphs.slice(0, 2);
	const rest = paragraphs.slice(2);
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
	<meta name="theme-color" content="#1c1917" />
</svelte:head>

<main class="bg-paper text-ink">
	<MapHero />

	<header class="intro">
		<p class="kicker">Seapunk Studios presents</p>
		<h1>Riverbanks</h1>
		{#each fold as p, i (i)}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own intro.md, escaped by intro() -->
			<p>{@html p}</p>
		{/each}

		<a class="start" href="/p/{EDITION.chapters[0].first}">Start reading →</a>
		<p class="note">
			Best read on a tablet held upright. Tap a glowing marker to start at that act.
		</p>
	</header>

	<section class="after more" aria-label="About Riverbanks">
		{#each rest as p, i (i)}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own intro.md, escaped by intro() -->
			<p>{@html p}</p>
		{/each}
	</section>

	<nav class="after" aria-labelledby="chapters">
		<h2 id="chapters">Chapters</h2>
		<ol class="chapters">
			{#each EDITION.chapters as c (c.first)}
				<li><a href="/p/{c.first}">{c.title}</a></li>
			{/each}
		</ol>
	</nav>

	<section class="after" aria-labelledby="credits">
		<h2 id="credits">Credits</h2>
		{#if EDITION.credits}
			<a
				class="credits"
				href={pageSrc(EDITION.credits, 1600, PAGES.version)}
				target="_blank"
				rel="noopener"
			>
				<img
					src={pageSrc(EDITION.credits, 800, PAGES.version)}
					width={PAGES.width}
					height={PAGES.height}
					alt="The Riverbanks credits board. Open full size."
					loading="lazy"
				/>
			</a>
		{/if}
	</section>

	{#if NEWSLETTER_URL}
		<section class="after" aria-labelledby="keep-in-touch">
			<h2 id="keep-in-touch">Keep in touch</h2>
			<p>New essays, events and editions of Riverbanks go out in the Seapunk newsletter.</p>
			<a class="start" href={NEWSLETTER_URL} target="_blank" rel="noopener"
				>Subscribe to the newsletter →</a
			>
		</section>
	{/if}

	<p class="licence">
		Riverbanks Volume I · BKKCAW26 Premiere Edition · CC BY-NC, Seapunk Studios &amp; collaborators
		2026 · <a href="https://seapunk.asia" target="_blank" rel="noopener">seapunk.asia</a>
	</p>

	<footer
		class="flex justify-between gap-4 bg-ink px-4 pt-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] font-pixel text-[15px] whitespace-nowrap text-paper sm:px-5 sm:text-xl"
	>
		<span>RIVERBANKS.LOL</span>
		<span>SEAPUNK STUDIOS</span>
	</footer>
</main>

<style>
	.intro,
	.after {
		width: min(100% - 2rem, 38rem);
		margin-inline: auto;
		font-family: var(--font-sans);
		font-size: 1.0625rem;
		line-height: 1.6;
	}
	.intro {
		padding: 3rem 0 2.5rem;
	}
	.intro p + p,
	.more p + p {
		margin-top: 0.9em;
	}
	.intro p :global(a),
	.more p :global(a) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.note {
		margin-top: 1rem;
		font-size: 0.9rem;
		font-weight: 300;
		color: rgb(28 25 23 / 0.75);
	}
	.kicker {
		font-family: var(--font-label);
		font-size: 0.95rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-teal);
	}
	h1 {
		font-family: var(--font-display);
		font-size: clamp(2.25rem, 11.5vw, 6rem);
		line-height: 0.95;
		margin: 0.15em 0 0.2em;
		text-transform: uppercase;
	}
	.start {
		display: inline-block;
		margin-top: 1.6rem;
		border-radius: 999px;
		background: var(--color-ink);
		color: var(--color-paper);
		padding: 0.7rem 1.4rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}
	.start:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}
	.after {
		padding: 1rem 0 3rem;
	}
	h2 {
		font-family: var(--font-display);
		font-size: 2rem;
		text-transform: uppercase;
		margin-bottom: 0.75rem;
	}
	.licence {
		width: min(100% - 2rem, 38rem);
		margin: 0 auto;
		padding: 0 0 1.5rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-weight: 300;
		color: rgb(28 25 23 / 0.75);
	}
	.licence a {
		color: inherit;
	}
	.chapters {
		display: grid;
		gap: 0.35rem;
	}
	.chapters a {
		color: inherit;
		font-weight: 500;
		text-underline-offset: 0.2em;
	}
	.chapters a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 2px;
	}
	.credits img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.25rem;
		box-shadow: 0 1px 6px rgb(28 25 23 / 0.18);
	}
</style>
