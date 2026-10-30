<script lang="ts">
	import { EDITION, PAGES, pageSrc } from '$lib/comic/edition';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	let { data } = $props();

	const credits = EDITION.credits;
	const description =
		'The credits for Riverbanks Volume I, the BKKCAW26 Premiere Edition: editors, writers, the studios that fed it, and partners.';
</script>

<svelte:head>
	<title>Credits · Riverbanks</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="{data.origin}/credits" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{data.origin}/credits" />
	<meta property="og:title" content="Credits · Riverbanks" />
	<meta property="og:description" content={description} />
	{#if credits}
		<meta property="og:image" content={data.origin + pageSrc(credits, 'card', PAGES.version)} />
	{/if}
	<meta name="theme-color" content="#f3ecdc" />
</svelte:head>

<div class="page">
	<SiteHeader current="credits" />

	<main>
		{#if credits}
			<a class="board" href={pageSrc(credits, 1600, PAGES.version)} target="_blank" rel="noopener">
				<img
					src={pageSrc(credits, 800, PAGES.version)}
					srcset="{pageSrc(credits, 800, PAGES.version)} 800w, {pageSrc(
						credits,
						1600,
						PAGES.version
					)} 1600w"
					sizes="(min-width: 900px) 34rem, 100vw"
					width={PAGES.width}
					height={PAGES.height}
					alt="The Riverbanks credits board: editors, writers, the studios that fed the exhibition, partners, and the tools used."
				/>
			</a>
		{/if}
		<div class="text">
			<p class="kicker">Riverbanks Volume I</p>
			<h1>Credits</h1>
			<p>
				The credits board from the BKKCAW26 Premiere Edition, shown at Bangkok Climate Action Week,
				5–10 October 2026, Lumpini Hall.
			</p>
			{#if credits}
				<a class="btn" href={pageSrc(credits, 1600, PAGES.version)} target="_blank" rel="noopener"
					>Open full size ↗</a
				>
			{/if}
			<p class="licence">
				CC BY-NC · Seapunk Studios &amp; collaborators 2026 ·
				<a href="https://seapunk.asia" target="_blank" rel="noopener">seapunk.asia</a>
			</p>
			<a class="back" href="/">← Back to the map</a>
		</div>
	</main>

	<footer class="made">
		<a href="https://site.thibi.co" target="_blank" rel="noopener">
			<span>Website by</span>
			<img src="/thibi-logo.svg" alt="Thibi" width="584" height="172" />
		</a>
	</footer>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-paper);
		color: var(--color-ink);
		font-family: var(--font-sans);
	}
	main {
		display: flex;
		justify-content: center;
		gap: 4rem;
		padding: 2.5rem 2rem 4rem;
	}
	.board {
		flex: none;
		width: 34rem;
	}
	.board img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.4rem;
		box-shadow: 0 2px 16px rgb(28 25 23 / 0.2);
	}
	.text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		width: 26rem;
		padding-top: 1.5rem;
		font-size: 1.125rem;
		line-height: 1.5;
	}
	.kicker {
		font-family: var(--font-label);
		font-size: 0.875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-teal);
	}
	h1 {
		font-family: var(--font-display);
		font-size: 4rem;
		font-weight: 400;
		line-height: 0.95;
		text-transform: uppercase;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		min-height: 3rem;
		padding: 0 1.4rem;
		border: 2px solid var(--color-ink);
		border-radius: 999px;
		color: inherit;
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
	}
	.licence {
		margin-top: 1.5rem;
		font-size: 0.875rem;
		font-weight: 300;
		color: #44403c;
	}
	.licence a,
	.back {
		color: inherit;
	}
	.back {
		font-size: 1rem;
		font-weight: 500;
	}
	a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}
	.made {
		display: flex;
		justify-content: center;
		padding: 1.5rem 1rem calc(2rem + env(safe-area-inset-bottom));
		border-top: 1px solid rgb(28 25 23 / 0.12);
	}
	.made a {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		color: #44403c;
		font-size: 0.875rem;
		text-decoration: none;
	}
	.made img {
		width: auto;
		height: 1.75rem;
	}
	.made a:hover span {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	@media (max-width: 899px) {
		main {
			flex-direction: column-reverse;
			align-items: center;
			gap: 2rem;
			padding: 1.5rem 1rem 3rem;
		}
		.board,
		.text {
			width: min(100%, 34rem);
		}
		.text {
			padding-top: 0;
		}
		h1 {
			font-size: 3rem;
		}
	}
</style>
