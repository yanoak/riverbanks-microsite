<script lang="ts">
	import { tick } from 'svelte';
	import { EDITION } from '$lib/comic/edition';
	import {
		check,
		empty,
		encode,
		FORM_RESPONSE,
		FORM_VIEW,
		INTERESTS,
		TRANSLATE,
		type Answers
	} from '$lib/form/fields';
	import { track } from '$lib/analytics';
	import { CAST_URL } from '$lib/site';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	let { data } = $props();

	const STEPS = 3;
	// What Taro says on each step, and after.
	const TARO = [
		'Pick one. Or all.',
		'Tell us a little about you.',
		'Last one, promise.',
		'Thank you!'
	];

	let step = $state<1 | 2 | 3 | 'done'>(1);
	let answers = $state<Answers>(empty());
	let error = $state<{ field: string; message: string } | null>(null);
	let sending = $state(false);
	let failed = $state(false);
	let heading = $state<HTMLElement>();

	const translating = $derived(answers.interests.includes(TRANSLATE));
	const n = $derived(step === 'done' ? STEPS : step);

	async function show(next: typeof step) {
		step = next;
		error = null;
		await tick();
		heading?.focus();
	}

	async function next() {
		if (step === 'done') return;
		error = check(step, answers);
		if (error) {
			await tick();
			document.querySelector<HTMLElement>(`[data-field="${error.field}"]`)?.focus();
			return;
		}
		if (step < STEPS) return show((step + 1) as 2 | 3);
		await send();
	}

	// Google's endpoint takes a plain cross-origin POST but won't say how it went (no-cors): a
	// request that resolves counts as sent; one that throws (offline, blocked) shows the fallback.
	async function send() {
		sending = true;
		failed = false;
		try {
			await fetch(FORM_RESPONSE, { method: 'POST', mode: 'no-cors', body: encode(answers) });
			track('generate_lead', {
				interests: [...answers.interests, ...(answers.other.trim() ? ['other'] : [])].join(', '),
				updates: answers.updates ? 'yes' : 'no'
			});
			answers = empty();
			await show('done');
		} catch {
			failed = true;
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>Get involved · Riverbanks</title>
	<meta
		name="description"
		content="Translate, exhibit, teach or collaborate on Riverbanks: tell Seapunk Studios what you'd like to do. It takes about two minutes."
	/>
	<link rel="canonical" href="{data.origin}/get-involved" />
	<meta property="og:title" content="Get involved with Riverbanks" />
	<meta property="og:image" content="{data.origin}/og.jpg" />
	<meta name="theme-color" content="#f3ecdc" />
</svelte:head>

<div class="page">
	<SiteHeader current="get-involved" />

	<main>
		<div class="bar">
			<p class="kicker">Get involved</p>
			{#if step !== 'done'}
				<p class="progress">
					<span>{n} of {STEPS}</span>
					<span class="track" aria-hidden="true"
						><span class="fill" style:width="{(n / STEPS) * 100}%"></span></span
					>
				</p>
			{/if}
		</div>

		<div class="head">
			<div class="ask">
				{#if step === 1}
					<h1 tabindex="-1" bind:this={heading} id="ask">
						What would you like to do with Riverbanks?
					</h1>
					<p class="sub">Tick as many as you like. It takes about two minutes.</p>
				{:else if step === 2}
					<h1 tabindex="-1" bind:this={heading} id="ask">Tell us about you and your community</h1>
					<p class="sub">All optional, but it helps us reply in a useful way.</p>
				{:else if step === 3}
					<h1 tabindex="-1" bind:this={heading} id="ask">How do we reach you?</h1>
					<p class="sub">We'll write back about what you'd like to do.</p>
				{:else}
					<h1 tabindex="-1" bind:this={heading} id="ask">Thank you</h1>
					<p class="sub">Your answers are with Seapunk Studios. We'll be in touch.</p>
				{/if}
			</div>
			<figure class="taro" aria-hidden="true">
				<p class="bubble">{TARO[step === 'done' ? 3 : step - 1]}</p>
				<img src="/cast/taro.webp" alt="" width="400" height="400" />
			</figure>
		</div>

		{#if step === 'done'}
			<div class="actions done">
				<a class="btn" href="/p/{EDITION.chapters[0].first}">Start reading →</a>
				{#if CAST_URL}<a class="btn ghost" href={CAST_URL}>Meet the cast</a>{/if}
				<a class="btn ghost" href="/">Back to the map</a>
			</div>
		{:else}
			<form
				novalidate
				onsubmit={(e) => {
					e.preventDefault();
					next();
				}}
			>
				{#if step === 1}
					<fieldset aria-labelledby="ask" aria-describedby={error ? 'error' : undefined}>
						<div class="tiles">
							{#each INTERESTS as interest, i (interest)}
								<label class="tile" class:on={answers.interests.includes(interest)}>
									<input
										type="checkbox"
										value={interest}
										bind:group={answers.interests}
										data-field={i === 0 ? 'interests' : undefined}
									/>
									{interest}
								</label>
							{/each}
						</div>
						<label class="field other">
							<span>Something else?</span>
							<input type="text" bind:value={answers.other} placeholder="Tell us what" />
						</label>
					</fieldset>
				{:else if step === 2}
					<div class="fields">
						<label class="field">
							<span>Your name</span>
							<input type="text" autocomplete="name" bind:value={answers.name} />
						</label>
						<label class="field">
							<span>Where are you based?</span>
							<input type="text" autocomplete="address-level2" bind:value={answers.place} />
						</label>
						<label class="field">
							<span>Your community or organisation</span>
							<input type="text" autocomplete="organization" bind:value={answers.community} />
						</label>
						{#if translating}
							<label class="field">
								<span>Which language would you translate it into?</span>
								<input type="text" bind:value={answers.language} />
							</label>
						{/if}
						<label class="field">
							<span>Anything you'd like to tell us?</span>
							<small>What moved you, what bugged you, what you'd do with it.</small>
							<textarea rows="4" bind:value={answers.message}></textarea>
						</label>
					</div>
				{:else}
					<div class="fields">
						<label class="field">
							<span>Your email</span>
							<input
								type="email"
								autocomplete="email"
								inputmode="email"
								bind:value={answers.email}
								data-field="email"
								aria-invalid={error?.field === 'email' || undefined}
								aria-describedby={error ? 'error' : undefined}
							/>
						</label>
						<label class="tile" class:on={answers.updates}>
							<input type="checkbox" bind:checked={answers.updates} />
							Keep me posted about Riverbanks
						</label>
						<p class="note">
							Your answers go to a Google Form run by Seapunk Studios, who'll use your email only to
							write back and, if you ticked it, to send news.
						</p>
					</div>
				{/if}

				{#if error}<p class="error" id="error" role="alert">{error.message}</p>{/if}
				{#if failed}
					<p class="error" role="alert">
						That didn't send. Check your connection and try again, or
						<a href={FORM_VIEW} target="_blank" rel="noopener">answer on the Google Form</a>.
					</p>
				{/if}

				<div class="actions">
					{#if step > 1}
						<button
							type="button"
							class="btn ghost"
							onclick={() => show(((step as number) - 1) as 1 | 2)}>← Back</button
						>
					{/if}
					<span class="then">
						{step === 1 ? 'Next: about you' : step === 2 ? 'Next: how to reach you' : ''}
					</span>
					<button type="submit" class="btn" disabled={sending}>
						{step === 3 ? (sending ? 'Sending…' : 'Send') : 'Next →'}
					</button>
				</div>
			</form>
		{/if}
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
		width: min(100% - 2rem, 48rem);
		margin-inline: auto;
		padding: 2rem 0 4rem;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.kicker {
		font-family: var(--font-label);
		font-size: 0.875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-teal);
	}
	.progress {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.875rem;
		color: #57534e;
	}
	.track {
		width: 7.5rem;
		height: 0.375rem;
		border-radius: 999px;
		background: rgb(28 25 23 / 0.15);
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: var(--color-teal);
		transition: width 0.3s;
	}

	.head {
		display: flex;
		align-items: flex-end;
		gap: 1.5rem;
		margin-bottom: 1.75rem;
	}
	.ask {
		flex: 1 1 auto;
		min-width: 0;
	}
	h1 {
		font-size: clamp(1.75rem, 5vw, 2.5rem);
		font-weight: 600;
		line-height: 1.1;
	}
	h1:focus {
		outline: none;
	}
	.sub {
		margin-top: 0.6rem;
		font-size: 1.0625rem;
		color: #44403c;
	}
	.taro {
		display: flex;
		flex: none;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		width: 10rem;
	}
	.taro img {
		width: 8.5rem;
		height: 8.5rem;
		border: 3px solid var(--color-ink);
		border-radius: 50%;
	}
	.bubble {
		position: relative;
		border: 2px solid var(--color-ink);
		border-radius: 0.9rem;
		background: #fffaf0;
		padding: 0.45rem 0.8rem;
		font-size: 0.9rem;
		font-weight: 500;
		text-align: center;
	}
	.bubble::after {
		position: absolute;
		bottom: -0.55rem;
		left: 50%;
		width: 0.9rem;
		height: 0.9rem;
		translate: -50%;
		rotate: 45deg;
		border-right: 2px solid var(--color-ink);
		border-bottom: 2px solid var(--color-ink);
		background: #fffaf0;
		content: '';
	}

	fieldset {
		border: 0;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.tile {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		min-height: 4.75rem;
		padding: 0.9rem 1.1rem;
		border: 2px solid rgb(28 25 23 / 0.3);
		border-radius: 0.75rem;
		background: #fffaf0;
		font-size: 1.0625rem;
		font-weight: 500;
		cursor: pointer;
	}
	.tile.on {
		border-color: var(--color-ink);
		background: var(--color-signal);
	}
	.tile input {
		flex: none;
		width: 1.375rem;
		height: 1.375rem;
		margin: 0;
		accent-color: var(--color-ink);
	}
	.tile:has(input:focus-visible) {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 500;
	}
	.field.other {
		margin-top: 1rem;
	}
	.field small {
		font-size: 0.875rem;
		font-weight: 400;
		color: #57534e;
	}
	.field input,
	.field textarea {
		width: 100%;
		min-height: 3rem;
		padding: 0.65rem 0.85rem;
		border: 2px solid rgb(28 25 23 / 0.35);
		border-radius: 0.6rem;
		background: #fffaf0;
		font: inherit;
		font-weight: 400;
	}
	.field input:focus-visible,
	.field textarea:focus-visible {
		border-color: var(--color-ink);
		outline: 3px solid var(--color-teal);
		outline-offset: 2px;
	}
	.field input[aria-invalid='true'] {
		border-color: var(--color-brick);
	}
	.note {
		font-size: 0.875rem;
		font-weight: 300;
		color: #44403c;
	}
	.error {
		margin-top: 1rem;
		font-weight: 500;
		color: var(--color-brick);
	}
	.error a {
		color: inherit;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 2rem;
	}
	.actions.done {
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}
	.then {
		flex: 1 1 auto;
		font-size: 0.875rem;
		color: #57534e;
		text-align: right;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 3.25rem;
		padding: 0 1.75rem;
		border: 2px solid var(--color-ink);
		border-radius: 999px;
		background: var(--color-ink);
		color: var(--color-paper);
		font: inherit;
		font-size: 1.0625rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}
	.btn.ghost {
		background: transparent;
		color: var(--color-ink);
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.btn:focus-visible,
	.error a:focus-visible {
		outline: 3px solid var(--color-teal);
		outline-offset: 3px;
	}

	@media (max-width: 599px) {
		.head {
			flex-direction: column-reverse;
			align-items: flex-start;
			gap: 0.75rem;
		}
		.taro {
			flex-direction: row-reverse;
			align-items: center;
			width: auto;
		}
		.taro img {
			width: 4.5rem;
			height: 4.5rem;
		}
		.bubble::after {
			top: 50%;
			bottom: auto;
			left: -0.5rem;
			translate: 0 -50%;
			rotate: 135deg;
		}
		.tiles {
			grid-template-columns: minmax(0, 1fr);
		}
		.tile {
			min-height: 3.75rem;
		}
		.then {
			display: none;
		}
		.actions .btn[type='submit'] {
			flex: 1 1 auto;
		}
	}
</style>
