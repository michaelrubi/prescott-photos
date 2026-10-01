<!--
	Card payments for a session: prescottphotos.com/pay. Michael links clients
	here once a date is set, e.g. /pay?package=signature&for=retainer, and again
	for the balance (&for=balance). Stripe Checkout takes the card; see
	#lib/payments.ts for how the amount is worked out.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Button from '#lib/components/Button.svelte';
	import PageIntro from '#lib/components/PageIntro.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { packages, retainer } from '#lib/content.ts';
	import { paymentsEnabled, returnUrl, startCheckout, takeReturnState, type PaymentKind } from '#lib/payments.ts';

	let pkg = $state(packages.find((p) => p.featured)?.id ?? packages[0].id);
	let kind = $state<Exclude<PaymentKind, 'extras'>>('retainer');
	let status = $state<'idle' | 'sending' | 'paid' | 'error'>('idle');
	let canceled = $state(false);
	let error = $state('');
	let paidHeading = $state<HTMLElement>();

	const selected = $derived(packages.find((p) => p.id === pkg)!);
	const amounts = $derived({ retainer, balance: selected.price - retainer });
	const money = (n: number) => `$${n.toLocaleString('en-US')}`;

	onMount(() => {
		const params = new URLSearchParams(location.search);
		const p = params.get('package');
		const f = params.get('for');
		if (packages.some((x) => x.id === p)) pkg = p!;
		if (f === 'retainer' || f === 'balance') kind = f;

		const back = takeReturnState();
		if (back === 'paid') {
			status = 'paid';
			tick().then(() => paidHeading?.focus());
		}
		canceled = back === 'canceled';
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)) as Record<string, string>;
		status = 'sending';
		error = '';
		canceled = false;
		try {
			// Come back to this page with the same package and payment picked
			const url = new URL(location.href);
			url.searchParams.set('package', pkg);
			url.searchParams.set('for', kind);
			history.replaceState(history.state, '', url);
			await startCheckout({
				kind,
				package: pkg,
				name: data.name.trim(),
				email: data.email.trim(),
				success: returnUrl('paid'),
				cancel: returnUrl('canceled')
			});
		} catch (err) {
			console.error('Checkout failed:', err);
			status = 'error';
			error = "Checkout didn't open. Please try again in a minute, or reply to my email and I'll send an invoice instead.";
		}
	}
</script>

<Seo
	title="Pay for Your Session | Michael Rubi Photography"
	description="Pay your session retainer or balance securely by card."
	noindex
/>

<main>
	<PageIntro
		label="Payments"
		title={'Pay securely\nby card.'}
		lead="Pay your retainer or your session balance here. Checkout is handled by Stripe, so your card details never touch this site."
	/>

	<div class="layout">
		{#if status === 'paid'}
			<section class="done" aria-live="polite">
				<p class="mono">Payment received</p>
				<h2 tabindex="-1" bind:this={paidHeading}>Thank you.</h2>
				<p>Your payment went through and a receipt is on its way to your inbox. I'll be in touch with next steps.</p>
				<Button href="/" variant="ghost">Back to the site</Button>
			</section>
		{:else if !paymentsEnabled}
			<section class="done">
				<p class="mono">Not switched on yet</p>
				<h2>Online payments are coming soon.</h2>
				<p>For now, reply to my email and I'll send you an invoice.</p>
			</section>
		{:else}
			<form onsubmit={submit}>
				{#if canceled}
					<p class="notice" role="status">Checkout was cancelled, so nothing was charged. You can try again below.</p>
				{/if}
				<label>
					<span>Your package</span>
					<select bind:value={pkg}>
						{#each packages as p (p.id)}<option value={p.id}>{p.name} ({money(p.price)})</option>{/each}
					</select>
				</label>
				<fieldset>
					<legend>What you're paying</legend>
					<div class="options">
						<label class="option">
							<input type="radio" name="kind" value="retainer" bind:group={kind} />
							<span>
								<strong>Retainer · {money(amounts.retainer)}</strong>
								<small>Holds your date and comes off your package total.</small>
							</span>
						</label>
						<label class="option">
							<input type="radio" name="kind" value="balance" bind:group={kind} />
							<span>
								<strong>Balance · {money(amounts.balance)}</strong>
								<small>The rest of your {selected.name} package, due before your gallery is delivered.</small>
							</span>
						</label>
					</div>
				</fieldset>
				<div class="row">
					<label>
						<span>Your name</span>
						<input name="name" autocomplete="name" required maxlength="100" />
					</label>
					<label>
						<span>Email for your receipt</span>
						<input name="email" type="email" autocomplete="email" required maxlength="200" />
					</label>
				</div>

				{#if status === 'error'}
					<p class="error" role="alert">{error}</p>
				{/if}

				<div class="submit">
					<p class="total"><span class="mono">Total</span> {money(amounts[kind])}</p>
					<Button type="submit">{status === 'sending' ? 'Opening checkout…' : 'Continue to checkout'}</Button>
				</div>
			</form>
		{/if}

		<aside aria-labelledby="how">
			<h2 id="how" class="mono">How payment works</h2>
			<ol>
				<li><strong>A {money(retainer)} retainer</strong> holds your date once we've picked it together.</li>
				<li><strong>The balance</strong> is due after your session, before your gallery is delivered.</li>
				<li><strong>Extra images</strong> you pick beyond your package are paid for in your gallery.</li>
			</ol>
			<p>Retainers are non-refundable but carry over if you reschedule. See the <a href="/terms">terms</a>.</p>
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
		display: grid;
		gap: var(--space-4);
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
	label > span,
	legend {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-mono);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	input,
	select {
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
	input:hover,
	select:hover {
		border-color: var(--color-text-muted);
	}
	input:focus-visible,
	select:focus-visible {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 1px 0 var(--color-accent);
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
	}

	/* Retainer / balance choice: two cards, the picked one outlined in amber */
	.options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: var(--space-3);
	}
	.option {
		position: relative;
		display: block;
		cursor: pointer;
	}
	.option input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.option > span {
		display: grid;
		gap: var(--space-1);
		height: 100%;
		padding: var(--space-3);
		border: 1px solid var(--color-line);
		font-family: var(--font-sans);
		font-size: var(--text-base);
		letter-spacing: normal;
		text-transform: none;
		transition: border-color var(--duration-fast);
	}
	.option strong {
		color: var(--color-text);
		font-weight: 500;
	}
	.option small {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
	.option:hover > span {
		border-color: var(--color-text-muted);
	}
	.option input:checked + span {
		border-color: var(--color-accent);
		background: var(--color-surface);
	}
	.option input:focus-visible + span {
		outline: 2px solid var(--color-focus);
		outline-offset: 2px;
	}

	.submit {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-line);
	}
	.total {
		display: flex;
		align-items: baseline;
		gap: var(--space-3);
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: var(--tracking-tight);
	}
	.total .mono {
		font-size: var(--text-xs);
		font-weight: 400;
		color: var(--color-text-muted);
	}
	.notice,
	.error {
		margin: 0;
		padding: var(--space-3);
		border-left: 2px solid var(--color-accent);
		background: var(--color-surface);
	}
	.done {
		display: grid;
		justify-items: start;
		gap: var(--space-4);
		padding: var(--space-5);
		border: 1px solid var(--color-accent);
	}
	.done h2 {
		margin: 0;
		font-size: var(--text-xl);
		letter-spacing: -0.03em;
		outline: none;
	}
	.done p {
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
