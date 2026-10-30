<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { actsLabel, CAST, castUrl } from '../../content/cast';
	import { track } from '$lib/analytics';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	let { data } = $props();

	const description =
		'The people who speak in Riverbanks Volume I, from the Prologue to the Epilogue: a portrait and a sentence each.';

	let copied = $state<string | null>(null);
	let reset: ReturnType<typeof setTimeout> | undefined;

	async function copy(id?: string) {
		try {
			await navigator.clipboard.writeText(castUrl(data.origin, id));
		} catch {
			return;
		}
		copied = id ?? 'page';
		track('share', { method: 'copy_link', content_type: 'cast', item_id: id ?? 'cast' });
		clearTimeout(reset);
		reset = setTimeout(() => (copied = null), 2500);
	}

	// The whole page: the share sheet where there is one, else the link to copy.
	async function shareCast() {
		if (typeof navigator.share === 'function') {
			try {
				await navigator.share({
					title: 'The cast of Riverbanks',
					text: description,
					url: castUrl(data.origin)
				});
				track('share', { method: 'share_sheet', content_type: 'cast', item_id: 'cast' });
			} catch {
				// Closed without sharing.
			}
		} else copy();
	}

	// A link to a character lands on their card; focus its name, so a screen reader says who.
	onMount(() => {
		const land = async () => {
			const id = location.hash.slice(1);
			if (!CAST.some((c) => c.id === id)) return;
			await tick();
			document.querySelector<HTMLElement>(`#${id} h2 a`)?.focus({ preventScroll: true });
		};
		land();
		window.addEventListener('hashchange', land);
		return () => {
			window.removeEventListener('hashchange', land);
			clearTimeout(reset);
		};
	});
</script>

<svelte:head>
	<title>The cast · Riverbanks</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={castUrl(data.origin)} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={castUrl(data.origin)} />
	<meta property="og:title" content="The cast of Riverbanks" />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="{data.origin}/cast/card.jpg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Portraits of the thirteen speaking characters of Riverbanks."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#f3ecdc" />
</svelte:head>

<div class="page">
	<SiteHeader current="cast" />

	<main>
		<header class="top">
			<div>
				<p class="kicker">Riverbanks Volume I</p>
				<h1>The cast</h1>
				<p class="intro">The people who speak, from the Prologue to the Epilogue.</p>
			</div>
			<button class="share" onclick={shareCast}>
				<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
					<path
						d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v9h14v-9"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{copied === 'page' ? 'Link copied' : 'Share the cast'}
			</button>
		</header>

		<ol class="grid">
			{#each CAST as c (c.id)}
				<li>
					<article id={c.id} class="card">
						<img src={c.portrait} alt={c.alt} width="400" height="400" loading="lazy" />
						<div class="who">
							<h2><a href="#{c.id}">{c.name}</a></h2>
							<p class="acts">{actsLabel(c.acts)}</p>
						</div>
						<button
							class="copy"
							aria-label={copied === c.id ? `Link to ${c.name} copied` : `Copy a link to ${c.name}`}
							onclick={() => copy(c.id)}
						>
							{#if copied === c.id}
								<span aria-hidden="true">✓</span>
							{:else}
								<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
									<path
										d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
									/>
								</svg>
							{/if}
						</button>
						<p class="line">{c.line}</p>
					</article>
				</li>
			{/each}
		</ol>

		<p class="licence">
			Portraits and story © Seapunk Studios &amp; collaborators 2026, CC BY-NC ·
			<a href="/">Back to the map</a>
		</p>
	</main>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--color-paper);
		color: var(--color-ink);
		font-family: var(--font-sans);
	}
	main {
		width: min(100% - 2rem, 68rem);
		margin-inline: auto;
		padding: 2.5rem 0 4rem;
	}
	.top {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 2rem;
	}
	.kicker {
		font-family: var(--font-label);
		font-size: 0.875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-teal);
	}
	h1 {
		margin: 0.2rem 0 0.4rem;
		font-family: var(--font-display);
		font-size: clamp(2.75rem, 8vw, 4rem);
		font-weight: 400;
		line-height: 0.95;
		text-transform: uppercase;
	}
	.intro {
		font-size: 1.0625rem;
		color: #44403c;
	}
	.share {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 3rem;
		padding: 0 1.2rem;
		border: 2px solid var(--color-ink);
		border-radius: 999px;
		font-weight: 500;
		cursor: pointer;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}
	.card {
		display: grid;
		grid-template-columns: 4.5rem 1fr auto;
		align-items: center;
		gap: 0.6rem 0.9rem;
		height: 100%;
		padding: 1rem;
		border-radius: 0.75rem;
		background: #fffaf0;
		box-shadow: 0 1px 4px rgb(28 25 23 / 0.12);
		scroll-margin-top: 1.5rem;
	}
	/* A card a link opened (/cast#taro). */
	.card:target {
		outline: 4px solid var(--color-signal);
		box-shadow:
			0 0 0 7px var(--color-ink),
			0 6px 18px rgb(28 25 23 / 0.2);
		outline-offset: 0;
	}
	.card img {
		width: 4.5rem;
		height: 4.5rem;
		border: 3px solid var(--color-ink);
		border-radius: 50%;
		background: var(--color-paper);
	}
	h2 {
		font-size: 1.2rem;
		font-weight: 600;
		line-height: 1.2;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.acts {
		margin-top: 0.2rem;
		font-family: var(--font-label);
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-teal);
	}
	.copy {
		display: grid;
		align-self: start;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border-radius: 999px;
		color: #57534e;
		cursor: pointer;
	}
	.copy:hover {
		background: rgb(28 25 23 / 0.07);
		color: var(--color-ink);
	}
	.line {
		grid-column: 1 / -1;
		font-size: 0.95rem;
		line-height: 1.5;
		color: #292524;
	}
	.licence {
		margin-top: 2.5rem;
		font-size: 0.85rem;
		font-weight: 300;
		color: #44403c;
	}
	.licence a {
		color: inherit;
	}
	button:focus-visible,
	a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}

	@media (max-width: 899px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 599px) {
		main {
			padding-top: 1.5rem;
		}
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
