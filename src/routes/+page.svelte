<script lang="ts">
	import TaroMixer from '$lib/components/TaroMixer.svelte';

	let { data } = $props();

	const title = 'Riverbanks';
	const description =
		'Riverbanks, a climate fiction exhibition by Seapunk Studios. The website is under construction: check back soon.';
	const message = 'Under construction! Check back soon.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.origin} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="{data.origin}/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Taro the kitten saying: {message}" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="theme-color" content="#f3ecdc" />
	<link rel="preload" as="image" href="/taro/poster.webp" />
</svelte:head>

<main class="relative flex min-h-dvh flex-col overflow-hidden bg-paper text-ink">
	<!-- The river map, as a very faint wash. Sunda only for now; the wider map comes later. -->
	<img
		src="/map/sunda-landmass.svg"
		alt=""
		class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[.12] saturate-[.6]"
	/>

	<h1 class="sr-only">{title}</h1>

	<div class="relative flex flex-1 items-center justify-center px-4 py-6">
		<!-- One composition in 390 × 600 units: the balloon's SVG uses them directly, and Taro's
		     stage is placed in percentages of them, so everything scales together and fits the
		     screen's height as well as its width. -->
		<div class="composition">
			<svg class="balloon" viewBox="0 0 390 600" aria-hidden="true">
				<!-- Outline first (doubled; the fill covers half of it), then the tail, then the fill
				     again, so the outline breaks where the tail joins. -->
				<ellipse cx="192" cy="162" rx="165" ry="76" fill="#fff" stroke="#1c1917" stroke-width="5" />
				<path
					d="M 144 232 L 161 272 L 182 235 Z"
					fill="#fff"
					stroke="#1c1917"
					stroke-width="2.5"
					stroke-linejoin="round"
				/>
				<ellipse cx="192" cy="162" rx="163.8" ry="74.8" fill="#fff" />
				<text x="192" y="155" font-size="22" font-weight="700" letter-spacing=".5"
					>UNDER CONSTRUCTION!</text
				>
				<text x="192" y="185" font-size="19" font-weight="500">Check back soon.</text>
			</svg>
			<p class="sr-only">Taro says: {message}</p>
			<div class="taro">
				<TaroMixer label="Taro the kitten, a grey tabby, standing and looking around" />
			</div>
		</div>
	</div>

	<footer
		class="relative flex justify-between gap-4 bg-ink px-4 pt-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] font-pixel text-[15px] whitespace-nowrap text-paper sm:px-5 sm:text-xl"
	>
		<span>RIVERBANKS.LOL</span>
		<span>SEAPUNK STUDIOS</span>
	</footer>
</main>

<style>
	.composition {
		position: relative;
		/* As wide as the screen allows, but never so tall that it runs under the footer. */
		width: min(100%, 440px, calc((100dvh - 7rem) * 390 / 600));
		aspect-ratio: 390 / 600;
	}
	.balloon {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.balloon text {
		font-family: var(--font-sans);
		fill: var(--color-ink);
		text-anchor: middle;
	}
	/* Taro's mouth sits at about (21%, 46%) of the video frame; the balloon's tail points at the
	   top of the head, so it stays right while the head moves. */
	.taro {
		position: absolute;
		left: 12%;
		width: 92%;
		top: 36.6%;
	}
</style>
