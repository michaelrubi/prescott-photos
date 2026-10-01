<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Button from '#lib/components/Button.svelte';
	import PageIntro from '#lib/components/PageIntro.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { packages, sessionTypes } from '#lib/content.ts';
	import { site } from '#lib/site.ts';

	let type = $state('portrait');
	let pkg = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let error = $state('');
	let firstName = $state('');
	let sentHeading = $state<HTMLElement>();

	const sources = ['Instagram', 'Facebook', 'Google', 'A friend', 'Somewhere else'];

	// Links like /book?type=senior or /book?package=signature pre-fill the form
	onMount(() => {
		const params = new URLSearchParams(location.search);
		const t = params.get('type');
		const p = params.get('package');
		if (sessionTypes.some((s) => s.id === t)) type = t!;
		if (packages.some((x) => x.id === p)) pkg = p!;
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
		if (data.botcheck) return;

		if (!site.inquiryWebhook) {
			status = 'error';
			error = "The booking form isn't connected yet. Please message me on Instagram or Facebook for now.";
			return;
		}

		status = 'sending';
		const typeLabel = sessionTypes.find((s) => s.id === data.type)?.label ?? data.type;
		try {
			const response = await fetch(site.inquiryWebhook, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...data, type: typeLabel, page: location.href, sentAt: new Date().toISOString() })
			});
			if (!response.ok) throw new Error(`Webhook responded ${response.status}`);
			firstName = data.name.trim().split(/\s+/)[0];
			status = 'sent';
			await tick();
			sentHeading?.focus();
		} catch {
			status = 'error';
			error = 'Something went wrong sending your message. Please try again in a minute, or message me on Instagram or Facebook.';
		}
	}
</script>

<Seo
	title="Book a Portrait Session | Michael Rubi Photography, Prescott AZ"
	description="Check availability and book a portrait, headshot, senior, couple or family session in Prescott, Arizona with Michael Rubi."
/>

<main>
	<PageIntro
		label="Book"
		title={"Let's find\nyour date."}
		lead="Tell me a little about what you have in mind. I reply to every inquiry within two business days with availability and ideas."
	/>

	<div class="layout">
		{#if status === 'sent'}
			<section class="sent" aria-live="polite">
				<p class="mono">Message received</p>
				<h2 tabindex="-1" bind:this={sentHeading}>Thanks, {firstName}.</h2>
				<p>
					Your inquiry is on its way. I'll reply by email within two business days with available dates and next
					steps. In the meantime, have a look through the portfolio for ideas you like.
				</p>
				<Button href="/work" variant="ghost">Browse the portfolio</Button>
			</section>
		{:else}
			<form onsubmit={submit}>
				<div class="row">
					<label>
						<span>Your name</span>
						<input name="name" autocomplete="name" required />
					</label>
					<label>
						<span>Email</span>
						<input name="email" type="email" autocomplete="email" required />
					</label>
				</div>
				<div class="row">
					<label>
						<span>Type of session</span>
						<select name="type" bind:value={type}>
							{#each sessionTypes as s (s.id)}<option value={s.id}>{s.label}</option>{/each}
						</select>
					</label>
					<label>
						<span>Package</span>
						<select name="package" bind:value={pkg}>
							<option value="">Not sure yet</option>
							{#each packages as p (p.id)}<option value={p.id}>{p.name} (${p.price})</option>{/each}
						</select>
					</label>
				</div>
				<div class="row">
					<label>
						<span>Dates that work <em>(optional)</em></span>
						<input name="dates" placeholder="e.g. weekends in late October" />
					</label>
					<label>
						<span>How did you find me? <em>(optional)</em></span>
						<select name="source">
							<option value="">Choose one</option>
							{#each sources as s (s)}<option>{s}</option>{/each}
						</select>
					</label>
				</div>
				<label>
					<span>What should I know?</span>
					<textarea
						name="message"
						rows="6"
						required
						placeholder="What the photos are for, who's coming, locations or looks you love…"
					></textarea>
				</label>
				<!-- Honeypot: hidden from people, irresistible to spam bots -->
				<input class="honeypot visually-hidden" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true" />

				{#if status === 'error'}
					<p class="error" role="alert">{error}</p>
				{/if}

				<div class="submit">
					<Button type="submit">{status === 'sending' ? 'Sending…' : 'Send inquiry'}</Button>
					<p class="mono">No spam, no mailing list. See the <a href="/privacy">privacy policy</a>.</p>
				</div>
			</form>
		{/if}

		<aside aria-labelledby="next">
			<h2 id="next" class="mono">What happens next</h2>
			<ol>
				<li><strong>I reply within two business days</strong> with open dates and a few location ideas.</li>
				<li><strong>We plan it together</strong> and a $100 retainer holds your date.</li>
				<li><strong>You get a what-to-wear guide</strong> so the session day is easy.</li>
			</ol>
			<p>
				Serving {site.serviceArea.slice(0, -1).join(', ')} and {site.serviceArea.at(-1)}. Elsewhere in Arizona? Ask
				anyway.
			</p>
		</aside>
	</div>
</main>

<style>
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--gutter) var(--space-7);
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
		gap: var(--space-6);
		align-items: start;
	}
	form {
		position: relative;
		display: grid;
		gap: var(--space-4);
	}
	.honeypot {
		top: 0;
		left: 0;
		margin: 0;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-4);
	}
	label {
		display: grid;
		gap: var(--space-2);
	}
	label > span {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-mono);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	label em {
		font-style: normal;
		opacity: 0.6;
		text-transform: none;
	}
	input,
	select,
	textarea {
		width: 100%;
		padding: 0.8em 0;
		border: 0;
		border-bottom: 1px solid var(--color-line);
		border-radius: 0;
		background: transparent;
		color: var(--color-text);
		font: inherit;
		font-size: var(--text-lg);
		transition: border-color var(--duration-fast);
	}
	select {
		appearance: none;
		background: linear-gradient(45deg, transparent 50%, var(--color-text-muted) 50%) right 0.6em center / 0.4em
				0.4em no-repeat,
			linear-gradient(-45deg, transparent 50%, var(--color-text-muted) 50%) right 0.2em center / 0.4em 0.4em
				no-repeat;
		cursor: pointer;
	}
	option {
		background: var(--color-surface);
		color: var(--color-text);
	}
	textarea {
		resize: vertical;
	}
	input::placeholder,
	textarea::placeholder {
		color: color-mix(in oklab, var(--color-text-muted), transparent 40%);
	}
	input:hover,
	select:hover,
	textarea:hover {
		border-color: var(--color-text-muted);
	}
	input:focus-visible,
	select:focus-visible,
	textarea:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 1px 0 var(--color-accent);
	}
	.submit {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4);
		padding-top: var(--space-2);
	}
	.submit p {
		margin: 0;
	}
	.error {
		margin: 0;
		padding: var(--space-3);
		border-left: 2px solid var(--color-accent);
		background: var(--color-surface);
	}
	.sent {
		display: grid;
		justify-items: start;
		gap: var(--space-4);
		padding: var(--space-5);
		border: 1px solid var(--color-accent);
	}
	.sent h2 {
		margin: 0;
		font-size: var(--text-xl);
		letter-spacing: -0.03em;
		outline: none;
	}
	.sent p {
		margin: 0;
		max-width: 50ch;
		color: var(--color-text-muted);
	}
	aside {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 1px solid var(--color-line);
		background: var(--color-surface);
	}
	aside h2 {
		margin: 0;
		font-weight: 400;
	}
	aside ol {
		display: grid;
		gap: var(--space-3);
		margin: 0;
		padding-left: 1.2em;
	}
	aside li::marker {
		font-family: var(--font-mono);
		color: var(--color-accent);
	}
	aside li {
		color: var(--color-text-muted);
	}
	aside strong {
		color: var(--color-text);
		font-weight: 500;
	}
	aside p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	@media (max-width: 52rem) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
