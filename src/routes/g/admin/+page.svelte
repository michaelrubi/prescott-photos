<!--
	Michael's proofing admin: create galleries, upload culled exports, send
	the link, and see what each client picked. Sign-in is with Google and only
	the accounts listed in firestore.rules can read or change anything.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { User } from 'firebase/auth';
	import type { Firestore, Unsubscribe } from 'firebase/firestore';
	import Seo from '#lib/components/Seo.svelte';
	import { packages } from '#lib/content.ts';
	import type { UploadProgress } from '#lib/proofing/admin.ts';
	import type { Gallery, Picks, ProofPhoto } from '#lib/proofing/gallery.ts';
	import { lightroomList } from '#lib/proofing/lightroom.ts';
	import { site } from '#lib/site.ts';

	type Admin = typeof import('#lib/proofing/admin.ts');
	type Api = typeof import('#lib/proofing/gallery.ts');
	type Fs = typeof import('firebase/firestore');
	type Auth = typeof import('firebase/auth');

	let view = $state<'loading' | 'unconfigured' | 'signed-out' | 'denied' | 'ready' | 'error'>('loading');
	let user = $state<User | null>(null);
	let galleries = $state.raw<Gallery[]>([]);
	const picks = new SvelteMap<string, Picks>();
	let selected = $state('');
	let photos = $state.raw<(ProofPhoto & { thumbUrl: string })[]>([]);
	let upload = $state<UploadProgress>();
	let dragging = $state(false);
	let message = $state('');
	let busy = $state(false);

	let db: Firestore;
	let fs: Fs;
	let auth: Auth;
	let admin: Admin;
	let api: Api;
	let stopLists: Unsubscribe[] = [];
	let emulated = false;
	let app: import('firebase/app').FirebaseApp;

	const current = $derived(galleries.find((g) => g.id === selected));
	const currentPicks = $derived(picks.get(selected));
	const pickedSet = $derived(new Set(currentPicks?.ids ?? []));
	const pickedNames = $derived(photos.filter((p) => pickedSet.has(p.id)).map((p) => p.name));
	const clientLink = (gid: string) => `${location.origin}/g#${gid}`;

	// Form for a new gallery, and the editable copy of the open one
	const blank = { title: '', client: '', message: '', included: 25, extraPrice: 0 };
	let draft = $state({ ...blank });
	let edit = $state({ ...blank, open: true });

	onMount(() => {
		const route = () => {
			const id = location.hash.slice(1);
			selected = /^[A-Za-z0-9]{20}$/.test(id) ? id : '';
		};
		route();
		window.addEventListener('hashchange', route);
		start();
		return () => {
			window.removeEventListener('hashchange', route);
			stopLists.forEach((stop) => stop());
		};
	});

	async function start() {
		try {
			const [fb, fs_, auth_, admin_, api_] = await Promise.all([
				import('#lib/proofing/firebase.ts'),
				import('firebase/firestore'),
				import('firebase/auth'),
				import('#lib/proofing/admin.ts'),
				import('#lib/proofing/gallery.ts')
			]);
			[fs, auth, admin, api] = [fs_, auth_, admin_, api_];
			try {
				({ app, db } = await fb.firebase('admin'));
			} catch (error) {
				view = error instanceof fb.NotConfiguredError ? 'unconfigured' : 'error';
				return;
			}
			const a = auth.getAuth(app);
			emulated = fb.useEmulators;
			if (emulated) auth.connectAuthEmulator(a, 'http://127.0.0.1:9099', { disableWarnings: true });
			auth.onAuthStateChanged(a, (u) => {
				user = u;
				stopLists.forEach((stop) => stop());
				stopLists = [];
				if (u) watchAll();
				else view = 'signed-out';
			});
		} catch (error) {
			console.error(error);
			view = 'error';
		}
	}

	function denied(error: { code?: string }) {
		console.error(error);
		view = error.code === 'permission-denied' ? 'denied' : 'error';
	}

	function watchAll() {
		view = 'loading';
		stopLists.push(
			fs.onSnapshot(
				fs.query(fs.collection(db, 'galleries'), fs.orderBy('createdAt', 'desc')),
				(snap) => {
					galleries = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Gallery);
					view = 'ready';
				},
				denied
			),
			fs.onSnapshot(
				fs.collection(db, 'picks'),
				(snap) => {
					picks.clear();
					for (const d of snap.docs) picks.set(d.id, { ...api.emptyPicks, ...d.data() } as Picks);
				},
				denied
			)
		);
	}

	async function signIn() {
		const a = auth.getAuth(app);
		// The Auth emulator takes an unsigned Google token, so local sign-in needs no Google account
		const signingIn = emulated
			? auth.signInWithCredential(
					a,
					auth.GoogleAuthProvider.credential(
						JSON.stringify({ sub: 'local-admin', email: 'mrubi.studios@gmail.com', email_verified: true })
					)
				)
			: auth.signInWithPopup(a, new auth.GoogleAuthProvider());
		await signingIn.catch((error) => {
			if (error.code !== 'auth/popup-closed-by-user') say(`Sign-in failed: ${error.message}`);
		});
	}

	// Photos of the open gallery, live, with thumbnails as object URLs
	const thumbs = new Map<string, string>();
	$effect(() => {
		if (view !== 'ready' || !selected) return;
		const stop = fs.onSnapshot(
			fs.query(fs.collection(db, 'galleries', selected, 'photos'), fs.orderBy('order')),
			(snap) => {
				photos = snap.docs.map((d) => {
					const photo = { ...d.data(), id: d.id } as ProofPhoto;
					let thumbUrl = thumbs.get(d.id);
					if (!thumbUrl) thumbs.set(d.id, (thumbUrl = api.bytesUrl(photo.thumb)));
					return { ...photo, thumbUrl };
				});
			},
			(error) => say(`Couldn't load photos: ${error.message}`)
		);
		return () => {
			stop();
			photos = [];
		};
	});

	// Refill the settings form when a different gallery opens
	let editing = '';
	$effect(() => {
		if (current && current.id !== editing) {
			editing = current.id;
			const { title, client, message, included, extraPrice, open } = current;
			edit = { title, client, message, included, extraPrice, open };
		}
	});

	let toastTimer: ReturnType<typeof setTimeout>;
	function say(text: string) {
		message = text;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (message = ''), 5000);
	}

	async function run(task: () => Promise<unknown>, done?: string) {
		busy = true;
		try {
			await task();
			if (done) say(done);
		} catch (error) {
			console.error(error);
			say(`That didn't work: ${(error as Error).message}`);
		} finally {
			busy = false;
		}
	}

	const fields = (f: typeof blank) => ({
		title: f.title.trim(),
		client: f.client.trim(),
		message: f.message.trim(),
		included: Math.max(1, Math.round(Number(f.included) || 1)),
		extraPrice: Math.max(0, Number(f.extraPrice) || 0)
	});

	function create(event: SubmitEvent) {
		event.preventDefault();
		run(async () => {
			const gid = await admin.createGallery(db, fields(draft));
			draft = { ...blank };
			location.hash = gid;
		});
	}

	function save(event: SubmitEvent) {
		event.preventDefault();
		run(() => admin.updateGallery(db, selected, { ...fields(edit), open: edit.open }), 'Saved');
	}

	async function addFiles(list: FileList | null | undefined) {
		const files = [...(list ?? [])].filter((f) => f.type.startsWith('image/'));
		if (!files.length || !current || upload) return;
		const start = photos.reduce((max, p) => Math.max(max, p.order + 1), 0);
		const gid = current.id;
		const result = await admin.uploadPhotos(db, gid, files, start, (p) => (upload = p));
		upload = undefined;
		say(
			result.failed.length
				? `Uploaded ${result.done - result.failed.length}. These didn't upload: ${result.failed.join(', ')}`
				: `Uploaded ${result.done} photos`
		);
	}

	function drop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		addFiles(event.dataTransfer?.files);
	}

	function copy(text: string, done: string) {
		navigator.clipboard.writeText(text).then(
			() => say(done),
			() => say("Couldn't copy. Select the text instead.")
		);
	}

	function removePhoto(photo: ProofPhoto) {
		if (!confirm(`Remove ${photo.name} from this gallery?`)) return;
		run(() => admin.deletePhoto(db, selected, photo.id));
	}

	function removeGallery() {
		if (!current) return;
		if (!confirm(`Delete "${current.title}" with all ${current.photoCount} photos and the client's picks? This can't be undone.`))
			return;
		run(async () => {
			await admin.deleteGallery(db, current!.id);
			location.hash = 'list';
		}, 'Gallery deleted');
	}

	function pickStatus(g: Gallery) {
		const p = picks.get(g.id);
		if (!p || p.ids.length === 0) return 'Not started';
		return `${p.submitted ? 'Sent' : 'Picking'} · ${p.ids.length}/${g.included}`;
	}

	const date = (t?: { toDate(): Date }) =>
		t ? t.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
</script>

<Seo title="Galleries | {site.name}" description="Proofing gallery admin." noindex />

<main>
	<header class="top">
		<div>
			<p class="mono">Proofing</p>
			<h1>{#if current}<a href="#list">Galleries</a> / {current.title}{:else}Galleries{/if}</h1>
		</div>
		{#if user}
			<p class="who mono">
				{user.email} · <button class="link" type="button" onclick={() => auth.signOut(auth.getAuth(app))}>Sign out</button>
			</p>
		{/if}
	</header>

	{#if view === 'loading'}
		<p class="mono">Loading…</p>
	{:else if view === 'unconfigured'}
		<p class="panel">
			Firebase isn't set up for this site yet: register a web app in the Firebase console and link it to the Hosting
			site. The README has the steps.
		</p>
	{:else if view === 'error'}
		<p class="panel">Something went wrong loading the admin. Check the browser console and refresh.</p>
	{:else if view === 'signed-out'}
		<div class="panel">
			<p>Sign in with the Google account that owns the galleries.</p>
			<button class="primary" type="button" onclick={signIn}>Sign in with Google</button>
		</div>
	{:else if view === 'denied'}
		<div class="panel">
			<p>
				{user?.email} can't manage galleries. Sign out and use an admin account, or add this address to
				<code>firestore.rules</code> and deploy the rules again.
			</p>
		</div>
	{:else if !selected}
		<section class="grid-2">
			<form class="panel form" onsubmit={create}>
				<h2>New gallery</h2>
				<label><span>Title</span><input bind:value={draft.title} required placeholder="Ava · Maternity at Watson Lake" /></label>
				<label><span>Client first name</span><input bind:value={draft.client} placeholder="Ava" /></label>
				<div class="row">
					<label>
						<span>Images included</span>
						<input type="number" min="1" bind:value={draft.included} required list="package-counts" />
					</label>
					<label>
						<span>Extra image price <em>($, 0 = no extras)</em></span>
						<input type="number" min="0" step="1" bind:value={draft.extraPrice} />
					</label>
				</div>
				<datalist id="package-counts">
					{#each packages as p (p.id)}<option value={parseInt(p.images)}>{p.name}</option>{/each}
				</datalist>
				<label>
					<span>Note to the client <em>(optional)</em></span>
					<textarea bind:value={draft.message} rows="3" placeholder="These are my favorites from Saturday…"></textarea>
				</label>
				<button class="primary" type="submit" disabled={busy}>Create and add photos</button>
			</form>

			<section class="list">
				{#if galleries.length === 0}
					<p class="muted">No galleries yet.</p>
				{:else}
					<ul>
						{#each galleries as g (g.id)}
							<li>
								<a href="#{g.id}">
									<strong>{g.title}</strong>
									<span class="mono">{g.photoCount} photos · {date(g.createdAt)}{g.open ? '' : ' · closed'}</span>
								</a>
								<span class="status mono" class:sent={picks.get(g.id)?.submitted}>{pickStatus(g)}</span>
							</li>
						{/each}
					</ul>
					<p class="mono muted">
						Free plan storage is 1 GB, roughly 30 galleries of 80 photos. Delete galleries once they're delivered.
					</p>
				{/if}
			</section>
		</section>
	{:else if !current}
		<div class="panel"><p>That gallery doesn't exist. <a href="#list">Back to galleries</a></p></div>
	{:else}
		<section class="share panel">
			<div>
				<p class="mono">Client link</p>
				<code>{clientLink(current.id)}</code>
			</div>
			<div class="buttons">
				<button class="primary" type="button" onclick={() => copy(clientLink(current!.id), 'Link copied')}>Copy link</button>
				<a class="ghost" href="/g#{current.id}" target="_blank" rel="noopener">Preview</a>
			</div>
		</section>

		<section class="grid-2">
			<section class="panel picks">
				<h2>Picks</h2>
				{#if !currentPicks || currentPicks.ids.length === 0}
					<p class="muted">No picks yet.</p>
				{:else}
					<p>
						<strong>{currentPicks.ids.length}</strong> of {current.included} picked
						{#if currentPicks.ids.length > current.included}
							· {currentPicks.ids.length - current.included} extra{#if current.extraPrice > 0}
								(${(currentPicks.ids.length - current.included) * current.extraPrice}){/if}
						{/if}
					</p>
					<p class="mono">
						{currentPicks.submitted ? `Sent ${date(currentPicks.submittedAt)}` : 'Still picking, not sent yet'}
					</p>
					{#if currentPicks.note}<blockquote>{currentPicks.note}</blockquote>{/if}
					<textarea readonly rows="3" value={lightroomList(pickedNames)} aria-label="Picked file names"></textarea>
					<div class="buttons">
						<button class="primary" type="button" onclick={() => copy(lightroomList(pickedNames), 'Copied for Lightroom')}>
							Copy for Lightroom
						</button>
						<button class="ghost" type="button" onclick={() => copy(pickedNames.join('\n'), 'Copied, one per line')}>
							Copy one per line
						</button>
						{#if currentPicks.submitted}
							<button
								class="ghost"
								type="button"
								disabled={busy}
								onclick={() => run(() => admin.reopenPicks(db, selected), 'Picks reopened')}>Reopen picks</button
							>
						{/if}
					</div>
					<p class="hint">
						In Lightroom Classic, open the Library filter's Text tab, choose Filename and "Contains", and paste.
					</p>
				{/if}
			</section>

			<form class="panel form" onsubmit={save}>
				<h2>Settings</h2>
				<label><span>Title</span><input bind:value={edit.title} required /></label>
				<label><span>Client first name</span><input bind:value={edit.client} /></label>
				<div class="row">
					<label><span>Images included</span><input type="number" min="1" bind:value={edit.included} required /></label>
					<label>
						<span>Extra image price <em>($)</em></span>
						<input type="number" min="0" step="1" bind:value={edit.extraPrice} />
					</label>
				</div>
				<label><span>Note to the client</span><textarea bind:value={edit.message} rows="3"></textarea></label>
				<label class="check"><input type="checkbox" bind:checked={edit.open} /> Open for picking</label>
				<button class="primary" type="submit" disabled={busy}>Save settings</button>
			</form>
		</section>

		<section class="photos">
			<h2>Photos <span class="mono">{photos.length}</span></h2>
			<label
				class="drop"
				class:dragging
				ondragover={(e) => {
					e.preventDefault();
					dragging = true;
				}}
				ondragleave={() => (dragging = false)}
				ondrop={drop}
			>
				<input
					type="file"
					accept="image/jpeg,image/png,image/webp"
					multiple
					class="visually-hidden"
					disabled={!!upload}
					onchange={(e) => {
						addFiles(e.currentTarget.files);
						e.currentTarget.value = '';
					}}
				/>
				{#if upload}
					<span>Uploading {upload.done} of {upload.total}…</span>
					<span class="meter"><span style:width="{(upload.done / upload.total) * 100}%"></span></span>
				{:else}
					<span><strong>Drop your culled exports here</strong> or click to choose. JPEGs work best; they're resized to 1600px
						in your browser and metadata is removed.</span>
				{/if}
			</label>

			<ul class="thumbs">
				{#each photos as photo (photo.id)}
					<li class:picked={pickedSet.has(photo.id)}>
						<img src={photo.thumbUrl} alt="" width={photo.width} height={photo.height} loading="lazy" />
						<span class="mono">{photo.name}</span>
						<button type="button" class="remove" aria-label="Remove {photo.name}" onclick={() => removePhoto(photo)}>×</button>
					</li>
				{/each}
			</ul>
		</section>

		<section class="danger">
			<button class="ghost" type="button" disabled={busy} onclick={removeGallery}>Delete gallery</button>
		</section>
	{/if}

	{#if message}<p class="toast" role="status">{message}</p>{/if}
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
		font-size: var(--text-xl);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
		line-height: 1.1;
	}
	h1 a {
		color: var(--color-text-muted);
		text-decoration: none;
	}
	h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-6) 0 var(--space-4);
	}
	.muted,
	.hint {
		color: var(--color-text-muted);
	}
	.hint {
		font-size: var(--text-sm);
	}
	code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		word-break: break-all;
	}
	.panel {
		display: grid;
		gap: var(--space-3);
		align-content: start;
		padding: var(--space-4);
		border: 1px solid var(--color-line);
		background: var(--color-surface);
	}
	.grid-2 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: var(--space-4);
		align-items: start;
		margin-bottom: var(--space-4);
	}

	.form label {
		display: grid;
		gap: var(--space-1);
	}
	.form label > span {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: var(--tracking-mono);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	em {
		font-style: normal;
		opacity: 0.7;
		text-transform: none;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}
	input:not([type='checkbox']),
	textarea {
		width: 100%;
		padding: 0.6em 0;
		border: 0;
		border-bottom: 1px solid var(--color-line);
		background: transparent;
		color: var(--color-text);
		font: inherit;
	}
	textarea {
		resize: vertical;
	}
	.picks textarea {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
	}
	.form .check {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	input[type='checkbox'] {
		accent-color: var(--color-accent);
		width: 1.1rem;
		height: 1.1rem;
	}

	.primary,
	.ghost {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		padding: 0.75em 1.3em;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: transparent;
		color: var(--color-text);
		font: 500 var(--text-sm) / 1 var(--font-sans);
		text-decoration: none;
		cursor: pointer;
	}
	.primary {
		border-color: transparent;
		background: var(--color-accent);
		color: var(--color-accent-text);
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-text);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.list ul {
		display: grid;
		margin: 0 0 var(--space-3);
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--color-line);
	}
	.list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-line);
	}
	.list a {
		display: grid;
		gap: var(--space-1);
		text-decoration: none;
	}
	.status.sent {
		color: var(--color-accent);
	}

	.share {
		grid-template-columns: 1fr auto;
		align-items: center;
		margin-bottom: var(--space-4);
	}
	@media (max-width: 40rem) {
		.share {
			grid-template-columns: 1fr;
		}
	}
	blockquote {
		margin: 0;
		padding-left: var(--space-3);
		border-left: 2px solid var(--color-accent);
		white-space: pre-line;
	}

	.photos {
		display: grid;
		gap: var(--space-3);
	}
	.photos h2 .mono {
		margin-left: var(--space-2);
	}
	.drop {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-5) var(--space-4);
		border: 1px dashed var(--color-text-muted);
		color: var(--color-text-muted);
		text-align: center;
		cursor: pointer;
	}
	.drop strong {
		color: var(--color-text);
	}
	.drop.dragging,
	.drop:focus-within {
		border-color: var(--color-accent);
	}
	.meter {
		display: block;
		height: 2px;
		background: var(--color-line);
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--color-accent);
	}
	.thumbs {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.thumbs li {
		position: relative;
		display: grid;
		gap: var(--space-1);
	}
	.thumbs img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		background: var(--color-surface);
	}
	.thumbs .picked img {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
	.thumbs .mono {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.remove {
		position: absolute;
		top: var(--space-1);
		right: var(--space-1);
		width: 1.8rem;
		height: 1.8rem;
		border: 0;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.6);
		color: #fff;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		opacity: 0;
	}
	.thumbs li:hover .remove,
	.remove:focus-visible {
		opacity: 1;
	}
	@media (hover: none) {
		.remove {
			opacity: 1;
		}
	}
	.danger {
		margin-top: var(--space-6);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-line);
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: var(--space-4);
		z-index: 20;
		max-width: min(36rem, calc(100vw - 2rem));
		padding: var(--space-2) var(--space-3);
		border-radius: 0.5rem;
		background: var(--color-text);
		color: var(--color-bg);
		font-size: var(--text-sm);
		transform: translateX(-50%);
	}
</style>
