<script lang="ts">
	import { onMount } from 'svelte';
	import { contents, chapterAt, pageSrc, EDITION, PAGES } from '$lib/comic/edition';

	const groups = contents(EDITION);
	const total = groups.reduce((n, g) => n + g.pages.length, 0);
	// Book position (1…total) of each page number, for the counter.
	const position = new Map(groups.flatMap((g) => g.pages).map((p, i) => [p, i + 1]));

	let current = $state(groups[0].pages[0]);
	let chapter = $derived(chapterAt(EDITION, current));

	const links: Record<number, HTMLAnchorElement> = {};

	/** Scroll to a page and put focus on it, so keyboard reading carries on from there. */
	export function goTo(page: number) {
		const link = links[page];
		if (!link) return;
		link.scrollIntoView({ behavior: 'smooth', block: 'start' });
		link.focus({ preventScroll: true });
	}

	onMount(() => {
		// The page crossing the middle of the screen is the one being read.
		const seen = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) current = Number(e.target.id.slice(2));
			},
			{ rootMargin: '-50% 0px -50% 0px' }
		);
		for (const el of document.querySelectorAll('.page')) seen.observe(el);
		return () => seen.disconnect();
	});
</script>

<section aria-label="The comic" class="reader">
	<div class="bar">
		<label class="sr-only" for="chapter">Chapter</label>
		<select
			id="chapter"
			value={chapter.first}
			onchange={(e) => goTo(Number(e.currentTarget.value))}
		>
			{#each groups as g (g.first)}
				<option value={g.first}>{g.title}</option>
			{/each}
		</select>
		<span class="count" aria-live="off">{position.get(current)}&thinsp;/&thinsp;{total}</span>
	</div>

	{#each groups as g (g.first)}
		{#each g.pages as p (p)}
			<figure class="page" id="p-{p}" style:aspect-ratio="{PAGES.width} / {PAGES.height}">
				<a
					bind:this={links[p]}
					href={pageSrc(p, 1600, PAGES.version)}
					target="_blank"
					rel="noopener"
					aria-label="Page {position.get(p)} of {total}, {g.title}. Open full size."
				>
					<img
						src={pageSrc(p, 800, PAGES.version)}
						srcset="{pageSrc(p, 800, PAGES.version)} 800w, {pageSrc(p, 1600, PAGES.version)} 1600w"
						sizes="(min-width: 900px) 860px, 100vw"
						width={PAGES.width}
						height={PAGES.height}
						alt=""
						loading={position.get(p)! <= 2 ? 'eager' : 'lazy'}
						decoding="async"
					/>
				</a>
				<span class="missing" aria-hidden="true">{position.get(p)}</span>
			</figure>
		{/each}
	{/each}
</section>

<style>
	.reader {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 2rem;
	}
	.bar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		background: var(--color-ink);
		color: var(--color-paper);
		padding: 0.5rem max(1rem, calc((100% - 860px) / 2));
		font-family: var(--font-sans);
	}
	select {
		min-width: 0;
		flex: 1 1 auto;
		max-width: 28rem;
		appearance: none;
		border: 1px solid color-mix(in srgb, var(--color-paper) 40%, transparent);
		border-radius: 0.25rem;
		background: transparent
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23f3ecdc' stroke-width='1.5'/%3E%3C/svg%3E")
			no-repeat right 0.6rem center / 0.65rem;
		color: inherit;
		font: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.4rem 1.8rem 0.4rem 0.6rem;
		text-overflow: ellipsis;
	}
	select option {
		color: var(--color-ink);
		background: var(--color-paper);
	}
	.count {
		font-family: var(--font-pixel);
		font-size: 1.05rem;
		white-space: nowrap;
	}
	.page {
		position: relative;
		width: min(100% - 1rem, 860px);
		margin: 0;
		overflow: hidden;
		background: color-mix(in srgb, var(--color-ink) 8%, var(--color-paper));
		box-shadow: 0 1px 6px rgb(28 25 23 / 0.18);
		scroll-margin-top: 3.5rem;
	}
	.page a {
		position: relative;
		z-index: 1;
		display: block;
		height: 100%;
	}
	.page a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}
	.page img {
		display: block;
		width: 100%;
		height: 100%;
	}
	/* Behind the image: shows only if it fails to load. */
	.missing {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: rgb(28 25 23 / 0.35);
		font-family: var(--font-pixel);
		font-size: 2rem;
	}
</style>
