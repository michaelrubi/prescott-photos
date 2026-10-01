<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import { reveal } from '#lib/motion/reveal.ts';

	const colors = [
		{ name: 'Background', token: '--color-bg', hex: '#0B0B0C' },
		{ name: 'Surface', token: '--color-surface', hex: '#141416' },
		{ name: 'Text', token: '--color-text', hex: '#ECEBE8' },
		{ name: 'Muted', token: '--color-text-muted', hex: '#9A9894' },
		{ name: 'Sunset amber', token: '--color-accent', hex: '#F2A35E' }
	];

	const reel = [
		{ tone: 'amber', ratio: '4 / 5', lens: '85mm', aperture: 'f/1.8', shutter: '1/500', iso: 100, label: 'Placeholder: golden hour portrait' },
		{ tone: 'granite', ratio: '3 / 4', lens: '50mm', aperture: 'f/2.0', shutter: '1/250', iso: 200, label: 'Placeholder: portrait on granite boulders' },
		{ tone: 'pine', ratio: '4 / 5', lens: '135mm', aperture: 'f/2.0', shutter: '1/640', iso: 100, label: 'Placeholder: portrait in the pines' },
		{ tone: 'dusk', ratio: '3 / 4', lens: '35mm', aperture: 'f/1.4', shutter: '1/125', iso: 800, label: 'Placeholder: blue hour portrait' }
	] as const;
</script>

<svelte:head>
	<title>Style preview | Michael Rubi Photography</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader />

<main>
	<!-- Hero -->
	<section class="hero">
		<Frame ratio="16 / 9" tone="amber" label="Placeholder: hero portrait">
			<div class="hero-copy">
				<p class="mono hero-label">Prescott, Arizona · 34.54° N 112.47° W</p>
				<h1>Portraits that<br />look like you.</h1>
				<div class="actions">
					<Button href="/book">Book a session</Button>
					<Button href="/work" variant="ghost">See the work</Button>
				</div>
			</div>
		</Frame>
	</section>

	<!-- Gallery strip -->
	<section class="block">
		<header class="block-head">
			<p class="mono">01 · Gallery strip</p>
			<h2>Hover or tab to a frame.</h2>
			<p class="note">Focus brackets snap in and the capture data brightens. Placeholders stand in for your photos.</p>
		</header>
		<div class="strip" {@attach reveal()}>
			{#each reel as shot, i (shot.label)}
				<Frame
					ratio={shot.ratio}
					tone={shot.tone}
					label={shot.label}
					frame={i + 1}
					total={reel.length}
					exif={{ lens: shot.lens, aperture: shot.aperture, shutter: shot.shutter, iso: shot.iso }}
				/>
			{/each}
		</div>
	</section>

	<!-- Type -->
	<section class="block">
		<header class="block-head">
			<p class="mono">02 · Type</p>
			<h2>Geist and Geist Mono.</h2>
		</header>
		<div class="type" {@attach reveal()}>
			<div>
				<p class="mono">Display · 48–128px</p>
				<p class="display">Embrace the moment.</p>
			</div>
			<div>
				<p class="mono">Heading · 28–44px</p>
				<p class="heading">Solo portraits in Prescott</p>
			</div>
			<div>
				<p class="mono">Body · 16px</p>
				<p class="body">
					Sessions are relaxed and guided. I'll help you pick a location, plan what to wear, and
					coach you through every pose, so you can forget the camera and just be yourself.
				</p>
			</div>
			<div>
				<p class="mono">Label · mono 12px</p>
				<p class="mono">85mm · f/1.8 · 1/500 · ISO 100</p>
			</div>
		</div>
	</section>

	<!-- Color -->
	<section class="block">
		<header class="block-head">
			<p class="mono">03 · Color</p>
			<h2>The photos bring the color.</h2>
		</header>
		<ul class="swatches" {@attach reveal()}>
			{#each colors as color (color.token)}
				<li>
					<span class="chip" style:background="var({color.token})"></span>
					<span>{color.name}</span>
					<span class="mono">{color.hex}</span>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Components, light theme -->
	<section class="block light" data-theme="light">
		<header class="block-head">
			<p class="mono">04 · Light theme for reading pages</p>
			<h2>Sessions & pricing</h2>
		</header>
		<div class="packages" {@attach reveal()}>
			<article class="package">
				<p class="mono">Essential</p>
				<p class="price">$—</p>
				<ul>
					<li>30 minutes, 1 location</li>
					<li>10 edited digital images</li>
					<li>Online gallery</li>
				</ul>
				<Button href="/book" variant="ghost">Choose Essential</Button>
			</article>
			<article class="package featured">
				<p class="mono">Signature · Most booked</p>
				<p class="price">$—</p>
				<ul>
					<li>60 minutes, 1–2 locations</li>
					<li>25 edited digital images</li>
					<li>Outfit change</li>
				</ul>
				<Button href="/book">Choose Signature</Button>
			</article>
			<article class="package">
				<p class="mono">Full Story</p>
				<p class="price">$—</p>
				<ul>
					<li>90 minutes, 2 locations</li>
					<li>40+ edited digital images</li>
					<li>Priority delivery</li>
				</ul>
				<Button href="/book" variant="ghost">Choose Full Story</Button>
			</article>
		</div>
	</section>

	<!-- Form -->
	<section class="block">
		<header class="block-head">
			<p class="mono">05 · Form</p>
			<h2>Booking stays simple.</h2>
		</header>
		<form class="form" onsubmit={(e) => e.preventDefault()}>
			<label>
				<span class="mono">Name</span>
				<input name="name" autocomplete="name" placeholder="Your name" />
			</label>
			<label>
				<span class="mono">Email</span>
				<input name="email" type="email" autocomplete="email" placeholder="you@example.com" />
			</label>
			<label class="wide">
				<span class="mono">Session</span>
				<select name="session">
					<option>Solo portrait</option>
					<option>Couple</option>
					<option>Family</option>
				</select>
			</label>
			<div class="wide">
				<Button type="submit">Send inquiry</Button>
			</div>
		</form>
	</section>
</main>

<style>
	main {
		padding-bottom: var(--space-7);
	}

	.hero {
		padding: var(--space-3) var(--gutter) 0;
	}
	.hero :global(.image) {
		min-height: min(80svh, 52rem);
		aspect-ratio: auto;
	}
	.hero-copy {
		position: absolute;
		inset: auto 0 0 0;
		padding: clamp(1.5rem, 5vw, 4rem);
		padding-top: var(--space-7);
		background: linear-gradient(to top, rgb(0 0 0 / 0.55), transparent);
		display: grid;
		gap: var(--space-3);
	}
	.hero-label {
		margin: 0;
		color: var(--color-text);
	}
	h1 {
		margin: 0;
		font-size: var(--text-display);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.block {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-7) var(--gutter) 0;
		background: var(--color-bg);
		color: var(--color-text);
	}
	.block-head {
		display: grid;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-line);
	}
	h2 {
		margin: 0;
		font-size: var(--text-xl);
		line-height: 1.05;
		letter-spacing: -0.03em;
		font-weight: 600;
	}
	.note {
		margin: 0;
		max-width: 40ch;
		color: var(--color-text-muted);
	}

	.strip {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-3);
		align-items: end;
	}
	@media (max-width: 56rem) {
		.strip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.type {
		display: grid;
		gap: var(--space-5);
	}
	.type p {
		margin: 0;
	}
	.display {
		font-size: var(--text-display);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
	.heading {
		font-size: var(--text-xl);
		letter-spacing: -0.03em;
		font-weight: 600;
	}
	.body {
		max-width: 60ch;
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.swatches li {
		display: grid;
		gap: var(--space-1);
	}
	.chip {
		aspect-ratio: 3 / 2;
		border: 1px solid var(--color-line);
	}

	.light {
		max-width: none;
		margin-top: var(--space-7);
		padding-bottom: var(--space-7);
	}
	.light > * {
		max-width: var(--max-width);
		margin-inline: auto;
	}
	.light .block-head {
		margin-bottom: var(--space-5);
	}
	.packages {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-3);
	}
	.package {
		display: grid;
		gap: var(--space-3);
		align-content: start;
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-line);
	}
	.package.featured {
		border-color: var(--color-accent);
	}
	.package p {
		margin: 0;
	}
	.price {
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.03em;
	}
	.package ul {
		margin: 0;
		padding-left: 1.1em;
		color: var(--color-text-muted);
	}

	.form {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-4) var(--space-3);
		max-width: 40rem;
	}
	.form label {
		display: grid;
		gap: var(--space-2);
	}
	.wide {
		grid-column: 1 / -1;
	}
	input,
	select {
		padding: 0.75em 0;
		border: 0;
		border-bottom: 1px solid var(--color-line);
		background: transparent;
		color: var(--color-text);
		font: inherit;
		transition: border-color var(--duration-fast);
	}
	input:focus,
	select:focus {
		outline: none;
		border-bottom-color: var(--color-accent);
	}
	select option {
		background: var(--color-surface);
	}
	@media (max-width: 40rem) {
		.form {
			grid-template-columns: 1fr;
		}
	}
</style>
