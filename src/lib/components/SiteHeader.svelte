<script lang="ts">
	import { EDITION } from '$lib/comic/edition';
	import { CAST_URL, GET_INVOLVED_URL } from '$lib/site';

	let {
		overlay = false,
		current = '',
		height = $bindable(0)
	}: {
		/** Translucent, over the map (the landing page); otherwise solid paper. */
		overlay?: boolean;
		/** The page the header is on, for `aria-current`. */
		current?: 'credits' | '';
		height?: number;
	} = $props();

	const start = `/p/${EDITION.chapters[0].first}`;
	let menu: HTMLDialogElement;
	let burger: HTMLButtonElement;

	function open() {
		menu.showModal();
		// The dialog would focus the wordmark; the first real choice is more useful.
		menu.querySelector<HTMLElement>('nav a')?.focus();
	}
	function close() {
		menu.close();
	}
</script>

<header class="site" class:overlay bind:offsetHeight={height}>
	<a class="mark" href="/">Riverbanks</a>

	<nav class="wide" aria-label="Site">
		<a class="link" href="/#chapters">Chapters</a>
		{#if CAST_URL}<a class="link" href={CAST_URL}>Cast</a>{/if}
		<a class="link" href="/credits" aria-current={current === 'credits' ? 'page' : undefined}
			>Credits</a
		>
		<a class="btn ghost" href={GET_INVOLVED_URL} target="_blank" rel="noopener">Get involved ↗</a>
		<a class="btn" href={start}>Start reading →</a>
	</nav>

	<div class="narrow">
		<a class="btn small" href={start}>Start reading</a>
		<button class="icon" bind:this={burger} aria-label="Menu" aria-haspopup="dialog" onclick={open}>
			<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M4 7h16M4 12h16M4 17h16"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	</div>
</header>

<!-- A modal dialog: it keeps Tab inside, closes on Esc, and the page behind goes inert. -->
<dialog class="menu" bind:this={menu} aria-label="Menu" onclose={() => burger.focus()}>
	<div class="menu-head">
		<a class="mark" href="/" onclick={close}>Riverbanks</a>
		<button class="icon" aria-label="Close menu" onclick={close}>
			<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M6 6l12 12M18 6L6 18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	</div>
	<nav aria-label="Site">
		<a href={start} onclick={close}>Start reading <span aria-hidden="true">→</span></a>
		<a href={GET_INVOLVED_URL} target="_blank" rel="noopener" onclick={close}
			>Get involved <span aria-hidden="true">↗</span></a
		>
		<a href="/#chapters" onclick={close}>Chapters &amp; map</a>
		{#if CAST_URL}<a href={CAST_URL} onclick={close}>Cast</a>{/if}
		<a href="/credits" onclick={close}>Credits</a>
	</nav>
	<p class="licence">
		Riverbanks Volume I · BKKCAW26 Premiere Edition<br />CC BY-NC · Seapunk Studios &amp;
		collaborators 2026 ·
		<a href="https://seapunk.asia" target="_blank" rel="noopener">seapunk.asia</a>
	</p>
</dialog>

<style>
	.site {
		position: relative;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 4.5rem;
		padding: 0 2rem;
		background: var(--color-paper);
		border-bottom: 1px solid rgb(28 25 23 / 0.12);
		font-family: var(--font-sans);
		color: var(--color-ink);
	}
	.site.overlay {
		position: absolute;
		inset: 0 0 auto;
		background: rgb(243 236 220 / 0.82);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
	}
	.mark {
		font-family: var(--font-display);
		font-size: 1.85rem;
		color: inherit;
		text-decoration: none;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.wide {
		display: flex;
		align-items: center;
		gap: 2rem;
	}
	.link {
		color: inherit;
		font-weight: 500;
		text-decoration: none;
	}
	.link:hover,
	.link[aria-current='page'] {
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 0.3em;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 1.35rem;
		border: 2px solid var(--color-ink);
		border-radius: 999px;
		background: var(--color-ink);
		color: var(--color-paper);
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}
	.btn.ghost {
		background: transparent;
		color: var(--color-ink);
	}
	.btn.small {
		padding: 0 1.1rem;
		font-size: 0.95rem;
	}
	.narrow {
		display: none;
		align-items: center;
		gap: 0.5rem;
	}
	.icon {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border-radius: 999px;
		color: inherit;
		cursor: pointer;
	}
	.site a:focus-visible,
	.icon:focus-visible,
	.menu a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}
	@media (max-width: 899px) {
		.site {
			height: 4.25rem;
			padding: 0 1rem 0 1.5rem;
		}
		.mark {
			font-size: 1.7rem;
		}
		.wide {
			display: none;
		}
		.narrow {
			display: flex;
		}
	}
	@media (max-width: 599px) {
		.site {
			height: 3.5rem;
			padding: 0 0.5rem 0 1rem;
		}
		.mark {
			font-size: 1.4rem;
		}
		.btn.small {
			display: none;
		}
	}

	.menu {
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: rgb(243 236 220 / 0.97);
		color: var(--color-ink);
		font-family: var(--font-sans);
	}
	.menu[open] {
		display: flex;
		flex-direction: column;
	}
	.menu::backdrop {
		background: transparent;
	}
	.menu-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 3.5rem;
		padding: 0 0.5rem 0 1rem;
		border-bottom: 1px solid rgb(28 25 23 / 0.12);
	}
	.menu nav {
		display: flex;
		flex-direction: column;
		padding: 0.75rem 1.25rem 0;
	}
	.menu nav a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.75rem;
		border-bottom: 1px solid rgb(28 25 23 / 0.14);
		color: inherit;
		font-size: 1.5rem;
		font-weight: 500;
		text-decoration: none;
	}
	.licence {
		margin: auto 1.25rem 1.5rem;
		font-size: 0.8rem;
		font-weight: 300;
		line-height: 1.5;
		color: #44403c;
	}
	.licence a {
		color: inherit;
	}
</style>
