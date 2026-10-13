<script lang="ts">
	import ComicReader from '$lib/components/ComicReader.svelte';
	import { EDITION, PAGES, pageSrc } from '$lib/comic/edition';

	let { data } = $props();

	const title = 'Riverbanks';
	const description =
		'Riverbanks, a climate fiction comic about ecoarchic institutions by Seapunk Studios. Read the whole series online.';

	// The existing newsletter's signup page. Until it is set, the keep-in-touch box is hidden.
	const NEWSLETTER_URL = '';

	let reader: ComicReader;
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
	<header class="intro">
		<p class="kicker">Seapunk Studios presents</p>
		<h1>Riverbanks</h1>
		<p class="lede">A climate fiction comic about ecoarchic institutions</p>

		<!-- Draft copy from the canon, for Sam to replace. -->
		<p>
			November 2027: six disasters strike in a single week, from the Caribbean to Japan to the Johor
			Straits. <em>Riverbanks</em> follows what the world builds afterwards, across five acts and more
			than sixty years, through the people and the rivers who have to live with it.
		</p>
		<p>
			It premiered as an exhibition of A1 boards at BKKCAW 2026 in Lumpini Park, Bangkok. This is
			the whole series, from the prologue to the epilogue, to read on any screen.
		</p>
		<p>
			<em>Riverbanks</em> is made by Seapunk Studios with collaborators across the region. Essays, references
			and reading lists are on their way.
		</p>

		<button class="start" onclick={() => reader.goTo(1)}>Start reading ↓</button>
	</header>

	<ComicReader bind:this={reader} />

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
	.intro p + p {
		margin-top: 0.9em;
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
	.lede {
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.35;
		margin-bottom: 1.4rem;
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
	.credits img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.25rem;
		box-shadow: 0 1px 6px rgb(28 25 23 / 0.18);
	}
</style>
