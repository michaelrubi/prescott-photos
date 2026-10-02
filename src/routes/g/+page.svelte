<!--
	A client's proofing gallery: prescottphoto.com/g#<gallery id>. The id
	sits in the URL hash so it never reaches a server log or a Referer header.
	Everything loads in the browser from Firestore (see #lib/proofing).
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Firestore } from 'firebase/firestore';
	import Button from '#lib/components/Button.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import type { Gallery, ProofPhoto } from '#lib/proofing/gallery.ts';
	import { lightroomList } from '#lib/proofing/lightroom.ts';
	import {
		paymentsEnabled,
		quoteExtras,
		returnUrl,
		startCheckout,
		takeReturnState,
		type ExtrasQuote
	} from '#lib/payments.ts';
	import type { proofViewer } from '#lib/proofing/viewer.ts';
	import { site } from '#lib/site.ts';

	type Api = typeof import('#lib/proofing/gallery.ts');
	type Photo = ProofPhoto & { thumbUrl: string };

	let view = $state<'loading' | 'missing' | 'unconfigured' | 'error' | 'ready'>('loading');
	let gallery = $state<Gallery>();
	let photos = $state.raw<Photo[]>([]);
	const picked = new SvelteSet<string>();
	let note = $state('');
	let submitted = $state(false);
	let showPicked = $state(false);
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let toast = $state('');
	let submitError = $state('');
	let sending = $state(false);
	let quote = $state<ExtrasQuote>();
	let returned = $state<'paid' | 'canceled'>();
	let paying = $state(false);
	let payError = $state('');
	let grid = $state<HTMLElement>();
	let dialog = $state<HTMLDialogElement>();

	let api: Api;
	let db: Firestore;
	let gid = '';
	let full: ReturnType<Api['fullImages']>;
	let viewer: ReturnType<typeof proofViewer> | undefined;

	const canPick = $derived(!!gallery?.open && !submitted);
	const visible = $derived(showPicked ? photos.filter((p) => picked.has(p.id)) : photos);
	const included = $derived(gallery?.included ?? 0);
	const extras = $derived(Math.max(0, picked.size - included));
	const extraTotal = $derived(extras * (gallery?.extraPrice ?? 0));
	const money = (n: number) => `$${n.toLocaleString('en-US')}`;
	// Extras are paid by card once picks are sent. The quote comes from n8n
	// (what Stripe has received); until it arrives, assume nothing is paid.
	const payable = $derived(paymentsEnabled && submitted && extraTotal > 0);
	const due = $derived(quote?.due ?? extraTotal);
	const extrasPaid = $derived(returned === 'paid' || (quote !== undefined && quote.due <= 0));

	onMount(() => {
		load();
		const reload = () => location.reload();
		window.addEventListener('hashchange', reload);
		return () => {
			window.removeEventListener('hashchange', reload);
			viewer?.destroy();
		};
	});

	async function load() {
		gid = location.hash.slice(1);
		returned = takeReturnState();
		if (!/^[A-Za-z0-9]{20}$/.test(gid)) {
			view = 'missing';
			return;
		}
		try {
			const [fb, gallery_] = await Promise.all([import('#lib/proofing/firebase.ts'), import('#lib/proofing/gallery.ts')]);
			api = gallery_;
			try {
				({ db } = await fb.firebase('gallery'));
			} catch (error) {
				view = error instanceof fb.NotConfiguredError ? 'unconfigured' : 'error';
				return;
			}
			const found = await api.loadGallery(db, gid);
			if (!found) {
				view = 'missing';
				return;
			}
			const [list, picks] = await Promise.all([api.loadPhotos(db, gid), api.loadPicks(db, gid)]);
			gallery = found;
			photos = list.map((p) => ({ ...p, thumbUrl: api.bytesUrl(p.thumb) }));
			const ids = new Set(list.map((p) => p.id));
			for (const id of picks.ids) if (ids.has(id)) picked.add(id);
			note = picks.note;
			submitted = picks.submitted;
			full = api.fullImages(db, gid);
			view = 'ready';
			refreshQuote();

			await tick();
			const { proofViewer } = await import('#lib/proofing/viewer.ts');
			viewer = proofViewer({
				grid: grid!,
				slides: () => visible,
				full: (id) => full.get(id),
				isPicked: (id) => picked.has(id),
				toggle,
				canPick: () => canPick
			});
		} catch (error) {
			console.error(error);
			view = 'error';
		}
	}

	let toastTimer: ReturnType<typeof setTimeout>;
	function say(message: string) {
		toast = message;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = ''), 4000);
	}

	function toggle(id: string) {
		if (!gallery || !canPick) return;
		if (picked.has(id)) {
			picked.delete(id);
		} else if (picked.size >= gallery.included && gallery.extraPrice <= 0) {
			say(`Your package includes ${gallery.included} photos. Unpick one to swap it for this one.`);
			return;
		} else {
			picked.add(id);
			if (picked.size === gallery.included + 1 && gallery.extraPrice > 0) {
				say(`That's one more than your package includes. Extras are ${money(gallery.extraPrice)} each.`);
			}
		}
		viewer?.refresh();
		queueSave();
	}

	/** Picks in gallery order */
	const pickedIds = () => photos.filter((p) => picked.has(p.id)).map((p) => p.id);

	// Picks save as they change (debounced), so the client can leave and come
	// back on another device. Saves run one at a time.
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let saving: Promise<unknown> = Promise.resolve();

	function queueSave() {
		saveState = 'saving';
		clearTimeout(saveTimer);
		saveTimer = setTimeout(flushSave, 900);
	}

	function flushSave(submit = false) {
		clearTimeout(saveTimer);
		saveTimer = undefined;
		const run = () => api.savePicks(db, gid, { ids: pickedIds(), note, submitted: submit });
		saving = saving.then(run, run);
		saving.then(
			() => (saveState = saveTimer ? 'saving' : 'saved'),
			() => (saveState = 'error')
		);
		return saving;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!gallery || sending) return;
		sending = true;
		submitError = '';
		try {
			await flushSave(true);
			submitted = true;
			dialog?.close();
			viewer?.refresh();
			notify(gallery);
			refreshQuote();
		} catch (error) {
			console.error(error);
			submitError =
				gallery.open === false
					? 'This gallery is closed for picking.'
					: "Your picks couldn't be sent. Check your connection and try again.";
		} finally {
			sending = false;
		}
	}

	/** Tells Michael through n8n. Best effort: the picks are already saved. */
	function notify(g: Gallery) {
		if (!site.picksWebhook) return;
		const names = photos.filter((p) => picked.has(p.id)).map((p) => p.name);
		fetch(site.picksWebhook, {
			method: 'POST',
			keepalive: true,
			body: new URLSearchParams({
				gallery: g.title,
				client: g.client,
				count: String(names.length),
				included: String(g.included),
				extras: String(extras),
				extraTotal: String(extraTotal),
				note,
				files: lightroomList(names),
				admin: `${site.url}/g/admin#${gid}`,
				sentAt: new Date().toISOString()
			})
		}).catch((error) => console.error(error));
	}

	function refreshQuote() {
		if (!payable) return;
		quoteExtras(gid).then(
			(q) => (quote = q),
			(error) => console.error('Quote failed:', error)
		);
	}

	async function payExtras() {
		if (paying) return;
		paying = true;
		payError = '';
		try {
			const { paid } = await startCheckout({
				kind: 'extras',
				gallery: gid,
				success: returnUrl('paid'),
				cancel: returnUrl('canceled')
			});
			if (paid) {
				quote = { total: extraTotal, paid: extraTotal, due: 0 };
				paying = false;
			}
		} catch (error) {
			console.error('Checkout failed:', error);
			payError = "Checkout didn't open. Please try again in a minute, or ask Michael for an invoice.";
			paying = false;
		}
	}

	function openViewer(index: number) {
		viewer?.open(index);
	}
</script>

<Seo title="Your gallery | {site.name}" description="A private proofing gallery." noindex />

<main>
	{#if view === 'loading'}
		<p class="status mono" aria-live="polite">Loading your gallery…</p>
	{:else if view === 'missing'}
		<section class="status">
			<p class="mono">Gallery not found</p>
			<h1>This link doesn't open a gallery.</h1>
			<p>Check that you copied the whole link from your email. If it still doesn't work, the gallery may have closed.</p>
			<Button href="/book" variant="ghost">Contact Michael</Button>
		</section>
	{:else if view === 'unconfigured'}
		<section class="status">
			<p class="mono">Not set up yet</p>
			<h1>Galleries aren't switched on yet.</h1>
		</section>
	{:else if view === 'error'}
		<section class="status">
			<p class="mono">Something went wrong</p>
			<h1>The gallery didn't load.</h1>
			<p>Check your connection and refresh the page.</p>
		</section>
	{:else if gallery}
		<header class="intro">
			<p class="mono">Private gallery · {photos.length} photos</p>
			<h1>{gallery.title}</h1>
			{#if gallery.message}<p class="message">{gallery.message}</p>{/if}
			{#if submitted}
				<p class="notice">
					Thank you{gallery.client ? `, ${gallery.client}` : ''}! Your {picked.size} picks are with Michael. If you'd like to
					change something, let him know and he'll reopen the gallery.
				</p>
				{#if payable}
					<div class="pay" aria-live="polite">
						{#if extrasPaid}
							<p><strong>Extras paid.</strong> Thank you! Your receipt is on its way to your inbox.</p>
						{:else}
							<p>
								Your {extras} extra image{extras === 1 ? '' : 's'} come{extras === 1 ? 's' : ''} to
								<strong>{money(due)}</strong>{#if quote && quote.paid > 0}
									after the {money(quote.paid)} you've already paid{/if}.
								{#if returned === 'canceled'}Checkout was cancelled, so nothing was charged.{/if}
							</p>
							<button class="send" type="button" disabled={paying} onclick={payExtras}>
								{paying ? 'Opening checkout…' : `Pay ${money(due)} by card`}
							</button>
							{#if payError}<p class="error" role="alert">{payError}</p>{/if}
						{/if}
					</div>
				{/if}
			{:else if !gallery.open}
				<p class="notice">This gallery is closed for picking.</p>
			{:else}
				<p class="how">
					Tap the heart on your favorites. Your package includes <strong>{included}</strong>{#if gallery.extraPrice > 0},
						and extras are {money(gallery.extraPrice)} each{/if}. Your picks save as you go, so you can come back any
					time before you send them.
				</p>
			{/if}
		</header>

		{#if showPicked && visible.length === 0}
			<p class="empty">No picks yet. Tap a heart to add one.</p>
		{/if}

		<ul class="grid" bind:this={grid}>
			{#each visible as photo, i (photo.id)}
				{@const isPicked = picked.has(photo.id)}
				<li data-pid={photo.id} class:picked={isPicked} style:--ar={photo.width / photo.height}>
					<button class="open" type="button" onclick={() => openViewer(i)} aria-label="View {photo.name}">
						<img src={photo.thumbUrl} alt="" width={photo.width} height={photo.height} loading="lazy" decoding="async" />
					</button>
					{#if canPick || isPicked}
						<button
							class="heart"
							type="button"
							aria-pressed={isPicked}
							aria-label="Pick {photo.name}"
							disabled={!canPick}
							onclick={() => toggle(photo.id)}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
								/>
							</svg>
						</button>
					{/if}
					<span class="name mono">{photo.name.replace(/\.[^.]+$/, '')}</span>
				</li>
			{/each}
		</ul>

		<div class="bar">
			<div class="count">
				<p>
					<strong>{picked.size}</strong> of {included} picked{#if extras > 0}<span class="extra">
							+ {extras} extra{extras === 1 ? '' : 's'} · {money(extraTotal)}</span
						>{/if}
				</p>
				<div class="meter" aria-hidden="true">
					<span style:width="{Math.min(100, (picked.size / Math.max(1, included)) * 100)}%"></span>
				</div>
				<p class="mono save" aria-live="polite">
					{#if saveState === 'saving'}Saving…{:else if saveState === 'saved'}Saved{:else if saveState === 'error'}Not
						saved. Check your connection{/if}
				</p>
			</div>
			<div class="actions">
				<button class="filter" type="button" aria-pressed={showPicked} onclick={() => (showPicked = !showPicked)}>
					{showPicked ? 'Show all' : 'Show picks'}
				</button>
				{#if canPick}
					<button class="send" type="button" disabled={picked.size === 0} onclick={() => dialog?.showModal()}>
						Send picks
					</button>
				{/if}
			</div>
		</div>

		{#if toast}<p class="toast" role="status">{toast}</p>{/if}

		<dialog bind:this={dialog} aria-labelledby="send-title">
			<form onsubmit={submit}>
				<h2 id="send-title">Send your {picked.size} picks?</h2>
				{#if picked.size < included}
					<p>
						Your package includes {included}, so you have {included - picked.size} more you can pick. You can send these
						now anyway.
					</p>
				{:else if extras > 0}
					<p>
						That's {included} included plus {extras} extra{extras === 1 ? '' : 's'} at {money(gallery.extraPrice)} each, {money(
							extraTotal
						)} in total. {paymentsEnabled
							? "You can pay for the extras by card once they're sent."
							: 'Michael will send an invoice for the extras.'}
					</p>
				{:else}
					<p>That's your full package. Michael will start editing these.</p>
				{/if}
				<p>Once they're sent, your picks are locked. Michael can reopen them if you change your mind.</p>
				<label>
					<span>Anything Michael should know? <em>(optional)</em></span>
					<textarea
						bind:value={note}
						rows="3"
						maxlength="2000"
						placeholder="Crop ideas, a favorite you'd like in black and white…"
					></textarea>
				</label>
				{#if submitError}<p class="error" role="alert">{submitError}</p>{/if}
				<div class="dialog-actions">
					<button type="button" class="filter" onclick={() => dialog?.close()}>Keep picking</button>
					<button type="submit" class="send" disabled={sending}>{sending ? 'Sending…' : 'Send picks'}</button>
				</div>
			</form>
		</dialog>
	{/if}
</main>

<style>
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--gutter) var(--space-7);
		min-height: 70vh;
	}
	p {
		margin: 0;
	}
	h1 {
		margin: 0;
		max-width: 20ch;
		font-size: var(--text-xl);
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}

	.status,
	.intro {
		display: grid;
		justify-items: start;
		gap: var(--space-3);
		padding: var(--space-6) 0 var(--space-5);
		max-width: 60ch;
	}
	.status > p:not(.mono) {
		color: var(--color-text-muted);
	}
	.message {
		font-size: var(--text-lg);
		white-space: pre-line;
	}
	.how,
	.notice {
		color: var(--color-text-muted);
	}
	.how strong {
		color: var(--color-text);
	}
	.notice {
		padding: var(--space-3);
		border-left: 2px solid var(--color-accent);
		background: var(--color-surface);
		color: var(--color-text);
	}
	.pay {
		display: grid;
		justify-items: start;
		gap: var(--space-3);
		padding: var(--space-3);
		border: 1px solid var(--color-line);
	}
	.pay strong {
		color: var(--color-text);
	}
	.empty {
		padding: var(--space-5) 0;
		color: var(--color-text-muted);
	}

	/* Justified rows: each photo grows in proportion to its aspect ratio */
	.grid {
		--row: clamp(9rem, 22vw, 15rem);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.grid::after {
		content: '';
		flex-grow: 999;
	}
	.grid li {
		position: relative;
		flex: calc(var(--ar) * 100) 1 calc(var(--ar) * var(--row));
		aspect-ratio: var(--ar);
		max-width: 100%;
		background: var(--color-surface);
	}
	.open {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: zoom-in;
	}
	.open img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: opacity var(--duration-base) var(--ease-focus);
	}
	.picked {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
	.name {
		position: absolute;
		left: var(--space-2);
		bottom: var(--space-1);
		color: rgb(255 255 255 / 0.8);
		text-shadow: 0 1px 4px rgb(0 0 0 / 0.7);
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--duration-fast);
	}
	.grid li:hover .name,
	.grid li:focus-within .name {
		opacity: 1;
	}

	.heart {
		position: absolute;
		top: var(--space-1);
		right: var(--space-1);
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.35);
		backdrop-filter: blur(6px);
		cursor: pointer;
	}
	.heart:disabled {
		cursor: default;
	}
	.heart svg {
		width: 1.4rem;
		fill: transparent;
		stroke: #fff;
		stroke-width: 1.7;
		transition:
			fill var(--duration-fast),
			stroke var(--duration-fast),
			transform var(--duration-fast) var(--ease-focus);
	}
	.heart[aria-pressed='true'] svg {
		fill: var(--color-accent);
		stroke: var(--color-accent);
		transform: scale(1.1);
	}

	/* Sticky tally and actions */
	.bar {
		position: sticky;
		bottom: 0;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin: var(--space-4) calc(var(--gutter) * -1) 0;
		padding: var(--space-3) var(--gutter);
		border-top: 1px solid var(--color-line);
		background: color-mix(in oklab, var(--color-bg), transparent 10%);
		backdrop-filter: blur(12px);
	}
	.count {
		display: grid;
		gap: var(--space-1);
		min-width: 12rem;
	}
	.count strong {
		font-size: var(--text-lg);
		color: var(--color-accent);
	}
	.extra {
		color: var(--color-text-muted);
	}
	.meter {
		height: 2px;
		background: var(--color-line);
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--color-accent);
		transition: width var(--duration-base) var(--ease-focus);
	}
	.save {
		min-height: 1.2em;
	}
	.actions,
	.dialog-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.filter,
	.send {
		padding: 0.8em 1.4em;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: transparent;
		color: var(--color-text);
		font: 500 var(--text-sm) / 1 var(--font-sans);
		cursor: pointer;
	}
	.filter[aria-pressed='true'] {
		border-color: var(--color-accent);
	}
	.send {
		border-color: transparent;
		background: var(--color-accent);
		color: var(--color-accent-text);
	}
	.send:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 6.5rem;
		z-index: 20;
		max-width: min(32rem, calc(100vw - 2rem));
		padding: var(--space-2) var(--space-3);
		border-radius: 0.5rem;
		background: var(--color-text);
		color: var(--color-bg);
		font-size: var(--text-sm);
		transform: translateX(-50%);
	}

	dialog {
		width: min(34rem, calc(100vw - 2rem));
		padding: var(--space-5) var(--space-4);
		border: 1px solid var(--color-line);
		background: var(--color-surface);
		color: var(--color-text);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.6);
		backdrop-filter: blur(4px);
	}
	dialog form {
		display: grid;
		gap: var(--space-3);
	}
	dialog h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
	}
	dialog p {
		color: var(--color-text-muted);
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
	textarea {
		width: 100%;
		padding: 0.8em 0;
		border: 0;
		border-bottom: 1px solid var(--color-line);
		background: transparent;
		color: var(--color-text);
		font: inherit;
		resize: vertical;
	}
	.error {
		padding: var(--space-3);
		border-left: 2px solid var(--color-accent);
		background: var(--color-bg);
		color: var(--color-text);
	}
</style>
