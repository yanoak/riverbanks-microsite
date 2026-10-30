<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import PhotoSwipe, { type SlideData } from 'photoswipe';
	import 'photoswipe/style.css';
	import { chapterAt, EDITION, PAGES, pageSrc } from '$lib/comic/edition';
	import { book, label, ticks } from '$lib/comic/reader';
	import { pageUrl, saveName, shareFor, shareMode } from '$lib/comic/share';
	import { track } from '$lib/analytics';

	let { start, origin }: { start: number; origin: string } = $props();

	const pages = book(EDITION);
	const marks = ticks(EDITION);
	/** The end card's slide index, one past the last page. */
	const END = pages.length;
	const v = PAGES.version;

	let index = $state(untrack(() => pages.indexOf(start)));
	let page = $derived(pages[Math.min(index, END - 1)]);
	let atEnd = $derived(index === END);
	let chapter = $derived(chapterAt(EDITION, page));
	let where = $derived(atEnd ? 'The end of Volume I' : label(EDITION, page));

	let shown = $state(false);
	let zoomed = $state(false);
	let hint = $state(false);
	let canFullscreen = $state(false);
	let fullscreen = $state(false);
	/** The Copy link / Save page menu, for browsers without a share sheet. */
	let sharing = $state<'page' | 'home' | null>(null);
	let copied = $state<boolean | null>(null);

	let pswp = $state.raw<PhotoSwipe>();
	let host: HTMLElement;
	let controls: HTMLElement;
	let menu: HTMLSelectElement;
	let shareButton: HTMLButtonElement;
	let shareMenu = $state<HTMLElement>();

	const slides: SlideData[] = [
		...pages.map((p) => ({
			src: pageSrc(p, 1600, v),
			srcset: `${pageSrc(p, 800, v)} 800w, ${pageSrc(p, 1600, v)} 1600w`,
			width: PAGES.width,
			height: PAGES.height,
			alt: label(EDITION, p)
		})),
		{ html: endCard() }
	];

	// PhotoSwipe draws the end card from a string, so it is plain HTML styled globally below.
	function endCard(): string {
		const credits = EDITION.credits
			? `<a class="credits" href="${pageSrc(EDITION.credits, 1600, v)}" target="_blank" rel="noopener">
					<img src="${pageSrc(EDITION.credits, 800, v)}" width="${PAGES.width}" height="${PAGES.height}"
						alt="The Riverbanks credits board. Open full size." loading="lazy" />
				</a>`
			: '';
		return `<div class="reader-end">
				<p class="kicker">The end of</p>
				<h2>Riverbanks Volume I</h2>
				${credits}
				<a class="home" href="/">← Back to Riverbanks</a>
				<button class="share" type="button">Share Riverbanks</button>
			</div>`;
	}

	function goTo(p: number) {
		pswp?.goTo(pages.indexOf(p));
	}

	// The controls fade after a few seconds without input, never while focus is inside them.
	let idle: ReturnType<typeof setTimeout> | undefined;
	function show() {
		shown = true;
		clearTimeout(idle);
		idle = setTimeout(() => {
			if (!controls.contains(document.activeElement)) shown = false;
		}, 4000);
	}
	function hide() {
		closeShare(false);
		clearTimeout(idle);
		shown = false;
		if (controls.contains(document.activeElement)) pswp?.element?.focus();
	}
	function toggle() {
		if (shown) hide();
		else show();
	}

	function zoomBy(factor: number) {
		const s = pswp?.currSlide;
		if (!s?.isZoomable()) return;
		const { fit, max } = s.zoomLevels;
		s.zoomTo(Math.min(Math.max(s.currZoomLevel * factor, fit), max), undefined, 250);
	}

	type Webkit = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element };
	function toggleFullscreen() {
		const d = document as Webkit & { webkitExitFullscreen?: () => void };
		const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
		if (document.fullscreenElement ?? d.webkitFullscreenElement) {
			(document.exitFullscreen ?? d.webkitExitFullscreen)?.call(document);
		} else {
			(el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
		}
	}

	// Our menu first, everywhere: the system sheet is one item in it, since on a laptop the
	// sheet offers AirDrop and Notes but not the chat apps. It shares the page on screen.
	let canShareSheet = $state(false);
	// GA's recommended `share` event: what was shared, and how.
	function shared(method: string) {
		track('share', {
			method,
			content_type: sharing === 'home' ? 'site' : 'page',
			item_id: sharing === 'home' ? 'home' : String(page)
		});
	}
	async function shareSheet() {
		shared('share_sheet');
		const target =
			sharing === 'page'
				? { ...shareFor(EDITION, page), url: pageUrl(origin, page) }
				: { title: 'Riverbanks', text: 'A climate fiction comic by Seapunk Studios.', url: origin };
		closeShare();
		try {
			await navigator.share(target);
		} catch {
			// Closing the sheet rejects too (Safari says NotAllowedError, not AbortError).
		}
	}
	async function share(what: 'page' | 'home') {
		show();
		sharing = what;
		copied = null;
		await tick();
		shareMenu?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
	}
	function closeShare(refocus = true) {
		if (!sharing) return;
		sharing = null;
		if (refocus) shareButton.focus();
	}
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(sharing === 'home' ? origin : pageUrl(origin, page));
			copied = true;
			shared('copy_link');
		} catch {
			copied = false;
		}
	}
	function shareMenuKeys(e: KeyboardEvent) {
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
		e.preventDefault();
		const items = [...shareMenu!.querySelectorAll<HTMLElement>('[role=menuitem]')];
		const at = items.indexOf(document.activeElement as HTMLElement);
		items[(at + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
	}
	function outside(e: PointerEvent) {
		const t = e.target as Node;
		if (sharing && !shareMenu?.contains(t) && !shareButton.contains(t)) closeShare(false);
	}

	async function openMenu() {
		show();
		await tick();
		menu.focus();
		try {
			menu.showPicker?.();
		} catch {
			// Not every browser lets a key open the picker; focus on the menu is enough.
		}
	}

	function keys(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === 'Escape') {
			if (sharing) closeShare();
			else if (shown) hide();
			return;
		}
		const t = e.target as HTMLElement;
		if (t.closest('input, select, button, a')) return;
		const done = () => e.preventDefault();
		switch (e.key) {
			case 'PageDown':
				done();
				return pswp?.next();
			case 'PageUp':
				done();
				return pswp?.prev();
			case ' ':
				done();
				return e.shiftKey ? pswp?.prev() : pswp?.next();
			case 'Home':
				done();
				return pswp?.goTo(0);
			case 'End':
				done();
				return pswp?.goTo(END - 1);
			case '+':
			case '=':
				return zoomBy(1.5);
			case '-':
				return zoomBy(1 / 1.5);
			case '0':
				return zoomBy(0);
			case 'f':
			case 'F':
				return canFullscreen && toggleFullscreen();
			case 'm':
			case 'M':
				done();
				return openMenu();
			case 's':
			case 'S':
				done();
				return share('page');
		}
	}

	// The scrubber's PageUp and PageDown step a chapter rather than a tenth of the book.
	function scrubKeys(e: KeyboardEvent) {
		if (e.key !== 'PageUp' && e.key !== 'PageDown') return;
		e.preventDefault();
		const next =
			e.key === 'PageDown'
				? marks.find((m) => m.index > index)
				: marks.findLast((m) => m.index < Math.min(index, END - 1));
		if (next) pswp?.goTo(next.index);
	}

	let hinted = false;
	$effect(() => {
		if (!zoomed || hinted) return;
		hinted = true;
		hint = true;
		const t = setTimeout(() => (hint = false), 3500);
		return () => clearTimeout(t);
	});

	// The URL follows the page without adding history, so Back leaves the reader in one step.
	$effect(() => {
		const url = `/p/${page}`;
		if (pswp && location.pathname !== url) replaceState(url, {});
		pswp?.element?.setAttribute('aria-label', where);
	});

	// Every page read, and reaching the end, for Google Analytics.
	$effect(() => {
		if (!pswp) return;
		if (atEnd) track('finish_book');
		else track('read_page', { page_number: page, chapter: chapter.title });
	});

	onMount(() => {
		const d = document as Webkit;
		canFullscreen = !!(document.fullscreenEnabled || d.webkitFullscreenEnabled);
		canShareSheet = shareMode(navigator) === 'native';
		const onFullscreen = () =>
			(fullscreen = !!(document.fullscreenElement ?? d.webkitFullscreenElement));
		document.addEventListener('fullscreenchange', onFullscreen);
		document.addEventListener('webkitfullscreenchange', onFullscreen);

		const p = new PhotoSwipe({
			dataSource: slides,
			index,
			appendToEl: host,
			mainClass: 'reader-pswp',
			loop: false,
			bgOpacity: 1,
			showHideAnimationType: 'none',
			padding: { top: 0, bottom: 0, left: 0, right: 0 },
			initialZoomLevel: 'fit',
			secondaryZoomLevel: 2.5,
			maxZoomLevel: 4,
			preload: [1, 2],
			tapAction: toggle,
			imageClickAction: toggle,
			bgClickAction: toggle,
			doubleTapAction: 'zoom',
			wheelToZoom: false,
			// It is a reader, not a lightbox: nothing closes it but the back link.
			pinchToClose: false,
			closeOnVerticalDrag: false,
			clickToCloseNonZoomable: false,
			escKey: false,
			trapFocus: false,
			returnFocus: false,
			arrowPrev: false,
			arrowNext: false,
			zoom: false,
			close: false,
			counter: false,
			errorMsg: 'This page did not load.'
		});

		p.on('change', () => (index = p.currIndex));
		p.on('zoomPanUpdate', ({ slide }) => {
			if (slide === p.currSlide) zoomed = slide.currZoomLevel > slide.zoomLevels.fit + 0.01;
		});
		p.on('keydown', (e) => {
			const k = e.originalEvent;
			// Keys in the controls are theirs, and Tab moves focus as usual.
			if (k.key === 'Tab' || controls.contains(k.target as Node)) return e.preventDefault();
			// Zoomed in, left and right pan the page instead of turning it.
			const s = p.currSlide;
			if (s && zoomed && (k.key === 'ArrowLeft' || k.key === 'ArrowRight')) {
				e.preventDefault();
				k.preventDefault();
				s.panTo(s.pan.x + (k.key === 'ArrowLeft' ? 80 : -80), s.pan.y);
			}
		});

		// The end card is PhotoSwipe's HTML, so its share button is wired up from here.
		host.addEventListener('click', (e) => {
			if ((e.target as HTMLElement).closest('.reader-end .share')) share('home');
		});

		p.init();
		pswp = p;
		p.element?.focus();

		return () => {
			clearTimeout(idle);
			document.removeEventListener('fullscreenchange', onFullscreen);
			document.removeEventListener('webkitfullscreenchange', onFullscreen);
			p.destroy();
			pswp = undefined;
		};
	});
</script>

<svelte:head>
	<title>{where} · Riverbanks</title>
</svelte:head>

<svelte:window onkeydown={keys} onpointerdown={outside} />

<div class="reader" bind:this={host}>
	<!-- Until PhotoSwipe takes over (and without JavaScript), the page as a plain image. -->
	{#if !pswp}
		<img
			class="still"
			src={pageSrc(start, 1600, v)}
			srcset="{pageSrc(start, 800, v)} 800w, {pageSrc(start, 1600, v)} 1600w"
			sizes="100vw"
			width={PAGES.width}
			height={PAGES.height}
			alt={label(EDITION, start)}
		/>
	{/if}

	<div
		class="controls"
		class:shown
		bind:this={controls}
		onfocusin={show}
		onpointerdown={show}
		oninput={show}
		role="toolbar"
		aria-label="Reader controls"
		tabindex="-1"
	>
		<div class="bar top">
			<a class="icon" href="/" aria-label="Back to Riverbanks">←</a>
			<label class="sr-only" for="chapter">Chapter</label>
			<select
				id="chapter"
				bind:this={menu}
				value={chapter.first}
				onchange={(e) => {
					goTo(Number(e.currentTarget.value));
					pswp?.element?.focus();
				}}
			>
				{#each marks as m (m.first)}
					<option value={m.first}>{m.title}</option>
				{/each}
			</select>
			<button
				class="icon"
				bind:this={shareButton}
				aria-label="Share this page"
				aria-haspopup="menu"
				aria-expanded={sharing !== null}
				onclick={() => (sharing ? closeShare() : share('page'))}
			>
				<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
					<path
						d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v9h14v-9"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if canFullscreen}
				<button
					class="icon"
					aria-label="Full screen"
					aria-pressed={fullscreen}
					onclick={toggleFullscreen}>⛶</button
				>
			{/if}
		</div>

		{#if sharing}
			<div
				class="share-menu"
				role="menu"
				aria-label="Share"
				tabindex="-1"
				bind:this={shareMenu}
				onkeydown={shareMenuKeys}
			>
				<button role="menuitem" onclick={copyLink}>
					{copied === true ? '✓ Link copied' : copied === false ? 'Could not copy' : 'Copy link'}
				</button>
				{#if sharing === 'page'}
					<a
						role="menuitem"
						href={pageSrc(page, 'jpg', v)}
						download={saveName(page)}
						onclick={() => {
							shared('save_image');
							closeShare();
						}}>Save page (JPEG)</a
					>
				{/if}
				{#if canShareSheet}
					<button role="menuitem" onclick={shareSheet}>More options…</button>
				{/if}
			</div>
		{/if}

		<div class="bar bottom">
			<button
				class="icon"
				aria-label="Previous page"
				disabled={index === 0}
				onclick={() => pswp?.prev()}>‹</button
			>
			<div class="scrub">
				{#each marks as m (m.first)}
					<span class="tick" style:left="{(m.index / (END - 1)) * 100}%" aria-hidden="true"></span>
				{/each}
				<input
					type="range"
					min="0"
					max={END - 1}
					step="1"
					value={Math.min(index, END - 1)}
					aria-label="Page"
					aria-valuetext={where}
					oninput={(e) => pswp?.goTo(Number(e.currentTarget.value))}
					onkeydown={scrubKeys}
				/>
			</div>
			<span class="where" aria-hidden="true">{atEnd ? 'End' : `p${page}`}</span>
			<button class="icon" aria-label="Next page" disabled={atEnd} onclick={() => pswp?.next()}
				>›</button
			>
		</div>
	</div>

	{#if hint}
		<p class="hint" aria-hidden="true">Swipe moves around the page · double-tap to fit</p>
	{/if}

	<p class="sr-only" aria-live="polite">{where}</p>
</div>

<style>
	.reader {
		position: fixed;
		inset: 0;
		background: var(--color-ink);
	}
	/* PhotoSwipe sets these on its own root, so they are overridden there: it sits under the
	   controls. */
	:global(.pswp.reader-pswp) {
		--pswp-root-z-index: 10;
		--pswp-bg: var(--color-ink);
	}
	.still {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.controls {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s;
		font-family: var(--font-sans);
		color: var(--color-paper);
	}
	.controls.shown,
	.controls:focus-within {
		opacity: 1;
	}
	.controls.shown .bar {
		pointer-events: auto;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgb(28 25 23 / 0.88);
		padding: 0.5rem max(0.75rem, env(safe-area-inset-left));
	}
	.top {
		padding-top: max(0.5rem, env(safe-area-inset-top));
	}
	.bottom {
		padding-bottom: max(0.6rem, env(safe-area-inset-bottom));
	}
	.icon {
		display: grid;
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border-radius: 999px;
		color: inherit;
		font-size: 1.5rem;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
	}
	.icon svg {
		display: block;
	}
	.share-menu {
		position: absolute;
		top: calc(max(0.5rem, env(safe-area-inset-top)) + 3.5rem);
		right: max(0.75rem, env(safe-area-inset-right));
		display: flex;
		flex-direction: column;
		min-width: 12rem;
		border-radius: 0.5rem;
		background: var(--color-paper);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
		color: var(--color-ink);
		padding: 0.35rem;
		pointer-events: auto;
	}
	.share-menu [role='menuitem'] {
		border-radius: 0.3rem;
		color: inherit;
		font: inherit;
		padding: 0.7rem 0.9rem;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}
	.share-menu [role='menuitem']:hover,
	.share-menu [role='menuitem']:focus-visible {
		background: rgb(28 25 23 / 0.08);
		outline: 2px solid var(--color-signal);
		outline-offset: -2px;
	}
	.icon:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.icon[aria-pressed='true'] {
		background: rgb(243 236 220 / 0.15);
	}
	select {
		min-width: 0;
		flex: 1 1 auto;
		appearance: none;
		border: 1px solid rgb(243 236 220 / 0.4);
		border-radius: 0.25rem;
		background: transparent
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23f3ecdc' stroke-width='1.5'/%3E%3C/svg%3E")
			no-repeat right 0.6rem center / 0.65rem;
		color: inherit;
		font: inherit;
		font-size: 1rem;
		font-weight: 500;
		padding: 0.55rem 1.8rem 0.55rem 0.7rem;
		text-overflow: ellipsis;
	}
	select option {
		color: var(--color-ink);
		background: var(--color-paper);
	}
	.scrub {
		position: relative;
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		height: 2.75rem;
	}
	.scrub input {
		position: relative;
		width: 100%;
		accent-color: var(--color-signal);
	}
	.tick {
		position: absolute;
		top: 50%;
		width: 2px;
		height: 0.9rem;
		translate: -1px -50%;
		background: rgb(243 236 220 / 0.55);
	}
	.where {
		min-width: 3.2rem;
		font-family: var(--font-pixel);
		font-size: 1.1rem;
		text-align: center;
		white-space: nowrap;
	}
	.icon:focus-visible,
	select:focus-visible,
	.scrub input:focus-visible {
		outline: 3px solid var(--color-signal);
		outline-offset: 2px;
	}
	.hint {
		position: fixed;
		bottom: max(1.5rem, env(safe-area-inset-bottom));
		left: 50%;
		z-index: 20;
		translate: -50%;
		border-radius: 999px;
		background: rgb(28 25 23 / 0.85);
		color: var(--color-paper);
		padding: 0.5rem 1rem;
		font-family: var(--font-sans);
		font-size: 0.9rem;
		white-space: nowrap;
		pointer-events: none;
	}

	:global(.reader-pswp:focus-visible) {
		outline: 3px solid var(--color-signal);
		outline-offset: -3px;
	}
	:global(.reader-end) {
		display: flex;
		height: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		color: var(--color-paper);
		font-family: var(--font-sans);
		text-align: center;
	}
	:global(.reader-end .kicker) {
		font-family: var(--font-label);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	:global(.reader-end h2) {
		font-family: var(--font-display);
		font-size: clamp(2rem, 7vw, 3.5rem);
		line-height: 1;
		text-transform: uppercase;
	}
	:global(.reader-end .credits img) {
		width: min(60vw, 22rem);
		height: auto;
		border-radius: 0.25rem;
	}
	:global(.reader-end a) {
		color: inherit;
	}
	:global(.reader-end .share) {
		color: inherit;
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	:global(.reader-end .home) {
		border-radius: 999px;
		background: var(--color-paper);
		color: var(--color-ink);
		padding: 0.7rem 1.4rem;
		font-weight: 600;
		text-decoration: none;
	}
</style>
