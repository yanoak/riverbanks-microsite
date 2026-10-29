<script lang="ts">
	import PageReader from '$lib/components/PageReader.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#1c1917" />
</svelte:head>

<!-- Keyed, so a fresh /p/[n] navigation opens the reader on that page. -->
{#key data.page}
	<PageReader start={data.page} />
{/key}
