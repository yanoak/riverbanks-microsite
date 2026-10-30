<script lang="ts">
	import PageReader from '$lib/components/PageReader.svelte';
	import { EDITION, PAGES } from '$lib/comic/edition';
	import { meta } from '$lib/comic/share';

	let { data } = $props();

	// The card for the page this URL was opened on: chats read the prerendered HTML, so turning
	// pages afterwards doesn't change it.
	const card = $derived(meta(EDITION, data.origin, data.page, PAGES.version));
</script>

<svelte:head>
	<meta name="theme-color" content="#1c1917" />
	<meta name="description" content={card.text} />
	<link rel="canonical" href={card.url} />
	<meta property="og:type" content="article" />
	<meta property="og:site_name" content="Riverbanks" />
	<meta property="og:url" content={card.url} />
	<meta property="og:title" content={card.title} />
	<meta property="og:description" content={card.text} />
	<meta property="og:image" content={card.image} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content={String(card.width)} />
	<meta property="og:image:height" content={String(card.height)} />
	<meta property="og:image:alt" content={card.alt} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- Keyed, so a fresh /p/[n] navigation opens the reader on that page. -->
{#key data.page}
	<PageReader start={data.page} origin={data.origin} />
{/key}
