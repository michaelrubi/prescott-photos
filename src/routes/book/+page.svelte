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
	const times = ['Sunrise', 'Morning', 'Golden hour', 'Any time'];
	const maxDates = 3;

	let dates = $state(['']);
	let time = $state('Any time');
	let minDate = $state('');

	// Links like /book?type=senior or /book?package=signature pre-fill the form
	onMount(() => {
		const params = new URLSearchParams(location.search);
		const t = params.get('type');
		const p = params.get('package');
		if (sessionTypes.some((s) => s.id === t)) type = t!;
		if (packages.some((x) => x.id === p)) pkg = p!;

		// Earliest pickable date is tomorrow, in the visitor's time zone
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		minDate = tomorrow.toLocaleDateString('en-CA');
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
			// Sent as a plain form post (no custom headers) so the browser skips the
			// CORS preflight; n8n still parses the fields into the webhook body.
			const response = await fetch(site.inquiryWebhook, {
				method: 'POST',
				body: new URLSearchParams({
					...data,
					type: typeLabel,
					// ISO dates (YYYY-MM-DD), earliest first, so n8n can use them without parsing
					dates: [...new Set(dates.filter(Boolean))].sort().join(', '),
					time,
					page: location.href,
					sentAt: new Date().toISOString()
				})
			});
			if (!response.ok) throw new Error(`Webhook responded ${response.status}`);
			firstName = data.name.trim().split(/\s+/)[0];
			status = 'sent';
			await tick();
			sentHeading?.focus();
		} catch (err) {
			console.error('Inquiry failed:', err);
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
				<fieldset>
					<legend>Preferred dates <em>(optional, up to {maxDates})</em></legend>
					<div class="dates">
						{#each dates as _, i (i)}
							<div class="date">
								<input type="date" min={minDate} bind:value={dates[i]} aria-label="Preferred date {i + 1}" />
								{#if dates.length > 1}
									<button
										type="button"
										class="remove"
										aria-label="Remove date {i + 1}"
										onclick={() => dates.splice(i, 1)}>×</button
									>
								{/if}
							</div>
						{/each}
						{#if dates.length < maxDates}
							<button type="button" class="add" onclick={() => dates.push('')}>+ Add another date</button>
						{/if}
					</div>
				</fieldset>
				<fieldset>
					<legend>Time of day</legend>
					<div class="chips">
						{#each times as t (t)}
							<label class="chip">
								<input type="radio" name="time" value={t} bind:group={time} />
								<span>{t}</span>
							</label>
						{/each}
					</div>
					<p class="hint">Golden hour, the hour before sunset, is the most flattering light for portraits.</p>
				</fieldset>
				<div class="row">
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
	input[type='date'] {
		color-scheme: dark;
	}
	fieldset {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-mono);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	legend em {
		font-style: normal;
		opacity: 0.6;
		text-transform: none;
	}
	.dates {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
		gap: var(--space-2) var(--space-4);
		align-items: end;
	}
	.date {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.remove,
	.add {
		border: 0;
		background: none;
		color: var(--color-text-muted);
		font: inherit;
		cursor: pointer;
	}
	.remove {
		font-size: var(--text-lg);
		line-height: 1;
	}
	.add {
		justify-self: start;
		padding: 0.8em 0;
		font-size: var(--text-sm);
	}
	.remove:hover,
	.add:hover {
		color: var(--color-accent);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.chip {
		position: relative;
		display: inline-flex;
		cursor: pointer;
	}
	.chip input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		pointer-events: none;
	}
	.chip span {
		padding: 0.55em 1em;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		transition:
			border-color var(--duration-fast),
			color var(--duration-fast);
	}
	.chip:hover span {
		color: var(--color-text);
	}
	.chip input:checked + span {
		border-color: var(--color-accent);
		color: var(--color-text);
	}
	.chip input:focus-visible + span {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}
	.hint {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
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
