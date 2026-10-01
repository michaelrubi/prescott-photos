<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '#lib/components/Button.svelte';
	import CallToBook from '#lib/components/CallToBook.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import { testimonials } from '#lib/content.ts';
	import { reveal } from '#lib/motion/reveal.ts';
	import { business, person } from '#lib/schema.ts';
	import { pictures, type PhotoMeta } from '#lib/photos.ts';
	import { loadMotion, reducedMotion } from '#lib/motion/gsap.ts';

	let { data } = $props();

	let hero: HTMLElement;
	let statement: HTMLElement;
	let reelSection: HTMLElement;
	let reelTrack: HTMLElement;

	const pad = (n: number) => String(n).padStart(2, '0');
	const capture = (p: PhotoMeta) => {
		const { lens, aperture, shutter, iso } = p.capture;
		return [lens, aperture, shutter, iso && `ISO ${iso}`].filter(Boolean).join(' · ');
	};

	const feel = [
		{
			title: 'You never have to guess',
			body: "Most people don't know what to do with their hands. You won't need to: I guide every pose and angle, so you can stop thinking about the camera."
		},
		{
			title: 'Light first, then location',
			body: 'Prescott has granite, pines and a brick downtown. I pick the spot and the hour around the light that flatters you.'
		},
		{
			title: 'Finished by hand',
			body: 'Every image is edited one at a time, with careful retouching that still looks like you. Your gallery arrives online, ready to share.'
		}
	];

	const words =
		"I'm Michael, a portrait photographer in Prescott, Arizona. Fourteen years in the Air Force taught me to stay calm, read the room and wait for the real moment. That's what your session feels like.".split(
			' '
		);

	onMount(() => {
		if (reducedMotion()) return;
		let ctx: gsap.Context | undefined;

		loadMotion().then(({ gsap }) => {
			ctx = gsap.context(() => {
				// Hero: the image drifts and the viewfinder fades as you scroll away
				gsap.to('.hero-image', {
					yPercent: 12,
					scale: 1.06,
					ease: 'none',
					scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
				});
				gsap.to('.viewfinder', {
					autoAlpha: 0,
					ease: 'none',
					scrollTrigger: { trigger: hero, start: 'top top', end: '40% top', scrub: true }
				});

				// Statement: words come into focus as you read down
				gsap.fromTo(
					statement.querySelectorAll('.word'),
					{ opacity: 0.12, filter: 'blur(3px)' },
					{
						opacity: 1,
						filter: 'blur(0px)',
						stagger: 0.05,
						ease: 'none',
						scrollTrigger: { trigger: statement, start: 'top 75%', end: 'bottom 45%', scrub: true }
					}
				);

				// Reel: vertical scrolling drives a horizontal strip of frames
				const mm = gsap.matchMedia();
				mm.add('(min-width: 48rem)', () => {
					const distance = () => reelTrack.scrollWidth - innerWidth;
					gsap.to(reelTrack, {
						x: () => -distance(),
						ease: 'none',
						scrollTrigger: {
							trigger: reelSection,
							start: 'top top',
							end: () => `+=${distance()}`,
							pin: true,
							scrub: 0.6,
							invalidateOnRefresh: true,
							onUpdate: (self) => {
								reelSection.style.setProperty('--progress', String(self.progress));
							}
						}
					});
				});
			});
		});

		return () => ctx?.revert();
	});
</script>

<Seo
	title="Michael Rubi Photography | Portraits in Prescott, Arizona"
	description="Modern portrait photography in Prescott, Arizona. Relaxed, guided sessions for headshots, personal branding, seniors, couples and families."
	image={data.heroShare}
	jsonld={[business(data.heroShare), person]}
/>


<main>
	<!-- Hero: opens like a shutter, framed like a viewfinder -->
	<section class="hero" bind:this={hero}>
		<div class="hero-image" style:background-image="url({data.hero.placeholder})">
			<enhanced:img
				src={pictures[data.hero.path]}
				alt={data.hero.alt}
				sizes="100vw"
				fetchpriority="high"
			/>
		</div>
		<div class="shutter top" aria-hidden="true"></div>
		<div class="shutter bottom" aria-hidden="true"></div>

		<div class="viewfinder mono" aria-hidden="true">
			<span class="vf-corner tl"></span>
			<span class="vf-corner tr"></span>
			<span class="vf-corner bl"></span>
			<span class="vf-corner br"></span>
			<span class="af-point"></span>
			<span class="vf-top"><span class="rec"></span>Prescott, AZ · 34.54° N 112.47° W</span>
			<span class="vf-bottom">{capture(data.hero)}</span>
		</div>

		<div class="hero-copy">
			<h1>
				<span class="line"><span>Portraits</span></span>
				<span class="line"><span>that look</span></span>
				<span class="line"><span>like <em>you.</em></span></span>
			</h1>
			<div class="hero-actions">
				<Button href="/book">Book a session</Button>
				<Button href="/work" variant="ghost">See the work</Button>
			</div>
		</div>
	</section>

	<!-- Statement -->
	<section class="statement" bind:this={statement}>
		<p class="mono label">01 · Hello</p>
		<p class="words">
			{#each words as word, i (i)}<span class="word">{word}</span>{' '}{/each}
		</p>
	</section>

	<!-- Reel -->
	<section class="reel" bind:this={reelSection} aria-label="Selected portraits">
		<header class="reel-head">
			<p class="mono label">02 · Selected frames</p>
			<span class="reel-progress" aria-hidden="true"><span></span></span>
		</header>
		<div class="reel-track" bind:this={reelTrack}>
			{#each data.reel as photo, i (photo.path)}
				<figure class="reel-frame" style:--ratio={photo.width / photo.height}>
					<p class="mono">{pad(i + 1)} / {pad(data.reel.length)}</p>
					<a
						href="/work#{photo.slug}"
						data-af
						aria-label="Frame {i + 1}: open in the portfolio"
						style:background-image="url({photo.placeholder})"
					>
						<enhanced:img src={pictures[photo.path]} alt={photo.alt} sizes="(min-width: 48rem) 40vw, 80vw" loading="lazy" />
					</a>
					<figcaption class="mono">{capture(photo)}</figcaption>
				</figure>
			{/each}
			<a class="reel-more" href="/work">
				<span class="mono">End of roll</span>
				<span class="more-title">See the full portfolio →</span>
			</a>
		</div>
	</section>

	<!-- What a session feels like -->
	<section class="feel">
		<SectionHead label="03 · The session" title="Easy on you. Obsessive about the details." />
		<ol class="feel-list" {@attach reveal({ stagger: 0.12 })}>
			{#each feel as point, i (point.title)}
				{@const photo = data.feel[i]}
				<li>
					<div class="feel-photo" style:background-image="url({photo.placeholder})">
						<enhanced:img src={pictures[photo.path]} alt={photo.alt} sizes="(min-width: 48rem) 30vw, 90vw" loading="lazy" />
					</div>
					<span class="mono">{pad(i + 1)}</span>
					<h3>{point.title}</h3>
					<p>{point.body}</p>
				</li>
			{/each}
		</ol>
		<p class="feel-more"><a href="/sessions">How sessions and pricing work →</a></p>
	</section>

	<!-- Kind words -->
	<section class="words-of-clients" aria-label="Client reviews">
		<p class="mono label">04 · Kind words</p>
		{#each testimonials as t (t.name)}
			<figure {@attach reveal()}>
				<blockquote>“{t.quote}”</blockquote>
				<figcaption class="mono">{t.name}</figcaption>
			</figure>
		{/each}
	</section>

	<div class="closing">
		<CallToBook label="05 · Your turn" />
	</div>
</main>

<style>
	.label {
		margin: 0;
	}

	/* ---------- Hero ---------- */
	.hero {
		position: relative;
		height: calc(100svh - 4.5rem);
		min-height: 32rem;
		overflow: hidden;
		background: #000;
	}
	.hero-image {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
	}
	.hero-image :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.hero-image::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgb(0 0 0 / 0.65), transparent 55%);
	}

	.shutter {
		position: absolute;
		left: 0;
		right: 0;
		height: 50.5%;
		z-index: 3;
		background: #050505;
		transform: scaleY(0);
	}
	.shutter.top {
		top: 0;
		transform-origin: top;
	}
	.shutter.bottom {
		bottom: 0;
		transform-origin: bottom;
	}

	.viewfinder {
		position: absolute;
		inset: clamp(1rem, 3vw, 2rem);
		z-index: 2;
		color: rgb(255 255 255 / 0.85);
		pointer-events: none;
	}
	.vf-corner {
		position: absolute;
		width: 2rem;
		height: 2rem;
		border: 0 solid rgb(255 255 255 / 0.7);
	}
	.vf-corner.tl { top: 0; left: 0; border-top-width: 1.5px; border-left-width: 1.5px; }
	.vf-corner.tr { top: 0; right: 0; border-top-width: 1.5px; border-right-width: 1.5px; }
	.vf-corner.bl { bottom: 0; left: 0; border-bottom-width: 1.5px; border-left-width: 1.5px; }
	.vf-corner.br { bottom: 0; right: 0; border-bottom-width: 1.5px; border-right-width: 1.5px; }
	.af-point {
		position: absolute;
		top: 38%;
		left: 50%;
		width: 3.5rem;
		height: 3.5rem;
		border: 1.5px solid var(--color-accent);
		translate: -50% -50%;
	}
	.vf-top,
	.vf-bottom {
		position: absolute;
		left: 2.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.vf-top {
		top: 0.5rem;
	}
	.vf-bottom {
		bottom: 0.5rem;
		right: 2.75rem;
		left: auto;
	}
	.rec {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-accent);
	}

	.hero-copy {
		position: absolute;
		left: clamp(1.5rem, 6vw, 5rem);
		bottom: clamp(3rem, 9vh, 6rem);
		z-index: 2;
		display: grid;
		gap: var(--space-4);
	}
	h1 {
		margin: 0;
		font-size: var(--text-display);
		line-height: 0.92;
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
		color: #fff;
	}
	h1 em {
		font-style: normal;
		color: var(--color-accent);
	}
	.line {
		display: block;
		overflow: hidden;
		padding-bottom: 0.06em;
	}
	.line > span {
		display: inline-block;
	}
	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	/* Intro sequence, CSS-only so it runs before any JavaScript loads */
	:global(html.motion) .shutter {
		animation: shutter 0.75s cubic-bezier(0.8, 0, 0.2, 1) 0.15s both;
	}
	:global(html.motion) .hero-image :global(img) {
		animation: focus-pull 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
	}
	:global(html.motion) .line > span {
		animation: rise 1s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	:global(html.motion) .line:nth-child(1) > span { animation-delay: 0.7s; }
	:global(html.motion) .line:nth-child(2) > span { animation-delay: 0.8s; }
	:global(html.motion) .line:nth-child(3) > span { animation-delay: 0.9s; }
	:global(html.motion) .hero-actions,
	:global(html.motion) .viewfinder > * {
		animation: fade 0.8s ease 1.1s both;
	}
	:global(html.motion) .af-point {
		animation: af-lock 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;
	}
	:global(html.motion) .rec {
		animation:
			fade 0.8s ease 1.1s both,
			blink 1.2s steps(2, jump-none) 1.9s infinite;
	}

	@keyframes shutter {
		from { transform: scaleY(1); }
		to { transform: scaleY(0); }
	}
	@keyframes focus-pull {
		from { filter: blur(18px) saturate(0.5); transform: scale(1.12); }
		to { filter: blur(0) saturate(1); transform: scale(1); }
	}
	@keyframes rise {
		from { transform: translateY(105%); }
	}
	@keyframes fade {
		from { opacity: 0; }
	}
	@keyframes af-lock {
		0% { opacity: 0; width: 9rem; height: 9rem; }
		60% { opacity: 1; width: 3.2rem; height: 3.2rem; }
		100% { opacity: 1; width: 3.5rem; height: 3.5rem; }
	}
	@keyframes blink {
		50% { opacity: 0.2; }
	}

	/* ---------- Statement ---------- */
	.statement {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-7) var(--gutter);
		display: grid;
		gap: var(--space-4);
	}
	.words {
		margin: 0;
		max-width: 24ch;
		font-size: clamp(1.75rem, 1rem + 3.2vw, 4rem);
		line-height: 1.08;
		letter-spacing: -0.035em;
		font-weight: 500;
	}

	/* ---------- Reel ---------- */
	.reel {
		--progress: 0;
		position: relative;
		min-height: 100svh;
		display: grid;
		grid-template-rows: auto 1fr;
		gap: var(--space-4);
		padding: var(--space-6) 0 var(--space-5);
		overflow: hidden;
	}
	.reel-head {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0 var(--gutter);
	}
	.reel-progress {
		flex: 1;
		max-width: 16rem;
		height: 1px;
		background: var(--color-line);
	}
	.reel-progress span {
		display: block;
		height: 100%;
		background: var(--color-accent);
		transform: scaleX(var(--progress));
		transform-origin: left;
	}
	.reel-track {
		display: flex;
		align-items: center;
		gap: clamp(1rem, 3vw, 3rem);
		padding: 0 var(--gutter);
		width: max-content;
	}
	.reel-frame {
		margin: 0;
		display: grid;
		gap: var(--space-2);
		height: min(68svh, 44rem);
		aspect-ratio: var(--ratio);
		grid-template-rows: auto 1fr auto;
	}
	.reel-frame p,
	.reel-frame figcaption {
		margin: 0;
	}
	.reel-frame a {
		display: block;
		min-height: 0;
		background-size: cover;
		overflow: hidden;
	}
	.reel-frame :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.8s var(--ease-focus);
	}
	.reel-frame a:hover :global(img) {
		transform: scale(1.03);
	}
	.reel-more {
		display: grid;
		align-content: center;
		gap: var(--space-2);
		width: min(28rem, 70vw);
		height: min(68svh, 44rem);
		padding: var(--space-5);
		border: 1px solid var(--color-line);
		text-decoration: none;
		transition: border-color var(--duration-base);
	}
	.reel-more:hover {
		border-color: var(--color-accent);
	}
	.more-title {
		font-size: var(--text-xl);
		letter-spacing: -0.03em;
		font-weight: 600;
	}

	/* Phones and reduced motion: a native swipeable strip instead of pinning */
	@media (max-width: 47.99rem) {
		.reel {
			min-height: auto;
		}
		.reel-track {
			width: auto;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			scrollbar-width: none;
		}
		.reel-frame,
		.reel-more {
			scroll-snap-align: center;
			height: 60svh;
		}
		.reel-progress {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.reel-track {
			width: auto;
			overflow-x: auto;
		}
	}

	/* ---------- The session ---------- */
	.feel,
	.words-of-clients,
	.closing {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: var(--space-7) var(--gutter) 0;
	}
	.feel-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-5) var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.feel-list li {
		display: grid;
		align-content: start;
		gap: var(--space-2);
	}
	.feel-photo {
		aspect-ratio: 4 / 5;
		margin-bottom: var(--space-2);
		overflow: hidden;
		background-size: cover;
	}
	.feel-photo :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.feel-list .mono {
		color: var(--color-accent);
	}
	.feel-list h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.feel-list p {
		margin: 0;
		color: var(--color-text-muted);
	}
	.feel-more {
		margin: var(--space-5) 0 0;
	}
	.feel-more a {
		text-decoration-color: var(--color-accent);
		text-underline-offset: 0.3em;
	}

	/* ---------- Kind words ---------- */
	.words-of-clients {
		display: grid;
		gap: var(--space-4);
	}
	.words-of-clients figure {
		margin: 0;
		display: grid;
		gap: var(--space-4);
	}
	blockquote {
		margin: 0;
		max-width: 30ch;
		font-size: clamp(1.5rem, 1rem + 2vw, 2.75rem);
		line-height: 1.15;
		letter-spacing: -0.03em;
		font-weight: 500;
	}
	.words-of-clients figcaption::before {
		content: '— ';
		color: var(--color-accent);
	}
</style>
