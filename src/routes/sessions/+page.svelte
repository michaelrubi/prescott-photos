<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import CallToBook from '#lib/components/CallToBook.svelte';
	import Faq from '#lib/components/Faq.svelte';
	import PageIntro from '#lib/components/PageIntro.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Steps from '#lib/components/Steps.svelte';
	import { addOns, packages, sessionFaqs, startingPrice } from '#lib/content.ts';
	import { reveal } from '#lib/motion/reveal.ts';
	import { faqPage } from '#lib/schema.ts';
	import { site } from '#lib/site.ts';

	const catalog = {
		'@type': 'OfferCatalog',
		name: 'Portrait session packages',
		url: `${site.url}/sessions`,
		itemListElement: packages.map((p) => ({
			'@type': 'Offer',
			name: `${p.name} portrait session`,
			description: `${p.session}, ${p.images}`,
			price: p.price,
			priceCurrency: 'USD',
			seller: { '@id': `${site.url}/#business` }
		}))
	};
</script>

<Seo
	title="Sessions & Pricing | Michael Rubi Photography, Prescott AZ"
	description="Portrait session packages in Prescott, Arizona from ${startingPrice}, with hand-edited digital images included. Prints, albums and wall art available from your gallery."
	jsonld={[catalog, faqPage(sessionFaqs)]}
/>

<main>
	<PageIntro
		label="Sessions & pricing"
		title={'Simple packages.\nNo surprises.'}
		lead="Every session includes posing guidance, hand-edited digital images and a private online gallery. Pick the one that fits, and add prints only if you want them."
	/>

	<section aria-labelledby="packages">
		<h2 id="packages" class="visually-hidden">Packages</h2>
		<ul class="packages" {@attach reveal({ stagger: 0.1 })}>
			{#each packages as p (p.id)}
				<li class:featured={p.featured}>
					<div class="top">
						<h3>{p.name}</h3>
						{#if p.featured}<span class="badge mono">Recommended</span>{/if}
					</div>
					<p class="amount"><span class="currency">$</span>{p.price}</p>
					<p class="summary">{p.summary}</p>
					<dl class="mono">
						<dt>Session</dt>
						<dd>{p.session}</dd>
						<dt>Images</dt>
						<dd>{p.images}</dd>
					</dl>
					<ul class="includes">
						{#each p.includes as item (item)}<li>{item}</li>{/each}
					</ul>
					<Button href="/book?package={p.id}" variant={p.featured ? 'primary' : 'ghost'}>Book {p.name}</Button>
				</li>
			{/each}
		</ul>
		<p class="note">Couples and families of up to six book the same packages.</p>
	</section>

	<section aria-labelledby="prints">
		<SectionHead id="prints" label="01 · Prints & albums" title="Want something to hold? Order it from your gallery." />
		<p class="intro-copy">
			Your digital images are yours to print anywhere. If you'd rather it be done right without the hassle, your
			online gallery has a built-in store with professional lab printing, shipped to your door.
		</p>
		<ul class="addons" {@attach reveal({ stagger: 0.06 })}>
			{#each addOns as a (a.name)}
				<li>
					<h3>{a.name}</h3>
					<p>{a.detail}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="how">
		<SectionHead id="how" label="02 · How it works" title="From hello to gallery in four steps." />
		<Steps />
	</section>

	<section aria-labelledby="faq">
		<SectionHead id="faq" label="03 · Good to know" title="Policies, in plain English." />
		<Faq faqs={sessionFaqs} />
	</section>

	<CallToBook title="Found your package?" body="Send a few details and a couple of dates that work. I'll confirm availability and help you plan the rest." />
</main>

<style>
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--gutter);
	}
	section {
		padding-bottom: var(--space-7);
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	p {
		margin: 0;
	}

	.packages {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: var(--space-3);
	}
	.packages > li {
		display: grid;
		grid-template-rows: auto auto auto auto 1fr auto;
		justify-items: start;
		gap: var(--space-3);
		padding: var(--space-5) var(--space-4);
		border: 1px solid var(--color-line);
	}
	.packages > li.featured {
		border-color: var(--color-accent);
		background: color-mix(in oklab, var(--color-accent), var(--color-bg) 94%);
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		width: 100%;
	}
	.badge {
		padding: 0.3em 0.7em;
		border: 1px solid var(--color-accent);
		border-radius: 999px;
		color: var(--color-accent);
	}
	.amount {
		font-size: var(--text-display);
		line-height: 1;
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
	.currency {
		font-size: 0.45em;
		vertical-align: 0.9em;
		margin-right: 0.05em;
		color: var(--color-text-muted);
	}
	.summary {
		color: var(--color-text-muted);
	}
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-1) var(--space-3);
		width: 100%;
		margin: 0;
		padding: var(--space-3) 0;
		border-block: 1px solid var(--color-line);
	}
	dd {
		margin: 0;
		color: var(--color-text);
	}
	.includes {
		display: grid;
		gap: var(--space-1);
	}
	.includes li {
		padding-left: 1.4em;
		position: relative;
	}
	.includes li::before {
		content: '';
		position: absolute;
		left: 0.15em;
		top: 0.55em;
		width: 0.55em;
		height: 0.55em;
		border: 1.5px solid var(--color-accent);
		border-left: 0;
		border-bottom: 0;
		transform: rotate(45deg) scale(0.8);
	}
	.note {
		margin-top: var(--space-3);
		color: var(--color-text-muted);
	}

	.intro-copy {
		max-width: 60ch;
		margin-bottom: var(--space-5);
		color: var(--color-text-muted);
		font-size: var(--text-lg);
	}
	.addons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		border-top: 1px solid var(--color-line);
	}
	.addons li {
		display: grid;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-4) var(--space-4) 0;
		border-bottom: 1px solid var(--color-line);
	}
	.addons p {
		color: var(--color-text-muted);
	}
</style>
