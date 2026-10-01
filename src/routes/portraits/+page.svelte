<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import CallToBook from '#lib/components/CallToBook.svelte';
	import Faq from '#lib/components/Faq.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import PageIntro from '#lib/components/PageIntro.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import Steps from '#lib/components/Steps.svelte';
	import { audiences, locations, portraitFaqs, startingPrice } from '#lib/content.ts';
	import { reveal } from '#lib/motion/reveal.ts';
	import { faqPage } from '#lib/schema.ts';
	import { site } from '#lib/site.ts';

	let { data } = $props();

	const service = {
		'@type': 'Service',
		serviceType: 'Portrait photography',
		provider: { '@id': `${site.url}/#business` },
		areaServed: site.serviceArea.map((name) => `${name}, AZ`),
		offers: { '@type': 'Offer', price: startingPrice, priceCurrency: 'USD', url: `${site.url}/sessions` }
	};
</script>

<Seo
	title="Portrait Photographer in Prescott, AZ | Michael Rubi"
	description="Relaxed, guided portrait sessions in Prescott, Arizona: maternity, creative and themed shoots, milestones and headshots. Hand-edited images from ${startingPrice}."
	jsonld={[service, faqPage(portraitFaqs)]}
/>

<main>
	<PageIntro
		label="Portraits · Prescott, AZ"
		title={'Portraits for people\nwho hate having\ntheir photo taken.'}
		lead="Relaxed, guided sessions around Prescott for maternity, creative ideas, headshots and the milestones worth marking. You bring yourself; I handle the rest."
	>
		<Button href="/book?type=portrait">Book a portrait session</Button>
		<Button href="/sessions" variant="ghost">From ${startingPrice}</Button>
	</PageIntro>

	<section aria-labelledby="recent">
		<SectionHead id="recent" label="01 · Recent portraits" title="A few people who were nervous too." />
		<Gallery photos={data.photos} />
	</section>

	<section aria-labelledby="for">
		<SectionHead id="for" label="02 · Who it's for" title="One session, built around why you need it." />
		<ul class="cards" {@attach reveal()}>
			{#each audiences as a (a.title)}
				<li>
					<h3>{a.title}</h3>
					<p>{a.body}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="how">
		<SectionHead id="how" label="03 · How it works" title="Four steps, and only one of them involves a camera." />
		<Steps />
	</section>

	<section aria-labelledby="where">
		<SectionHead id="where" label="04 · Where we'll shoot" title="Some favorite spots around Prescott." />
		<ul class="locations" {@attach reveal({ stagger: 0.05 })}>
			{#each locations as place, i (place.name)}
				<li>
					<span class="mono">{String(i + 1).padStart(2, '0')}</span>
					<h3>{place.name}</h3>
					<p>{place.detail}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section class="price" aria-label="Pricing">
		<p class="mono">Investment</p>
		<p class="price-line">Portrait sessions start at <strong>${startingPrice}</strong>, with edited digital images included.</p>
		<Button href="/sessions" variant="ghost">Compare packages</Button>
	</section>

	<section aria-labelledby="faq">
		<SectionHead id="faq" label="05 · Questions" title="Things people ask before booking." />
		<Faq faqs={portraitFaqs} />
	</section>

	<CallToBook href="/book?type=portrait" />
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
	.cards,
	.locations {
		display: grid;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.cards {
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
	}
	.cards li {
		display: grid;
		align-content: start;
		gap: var(--space-2);
		padding: var(--space-4);
		border: 1px solid var(--color-line);
		transition: border-color var(--duration-base);
	}
	.cards li:hover {
		border-color: color-mix(in oklab, var(--color-accent), transparent 40%);
	}
	h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	li p {
		margin: 0;
		color: var(--color-text-muted);
	}
	.locations {
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 0 var(--space-5);
	}
	.locations li {
		display: grid;
		grid-template-columns: 2.5rem 1fr;
		gap: var(--space-1) 0;
		padding: var(--space-3) 0;
		border-bottom: 1px solid var(--color-line);
	}
	.locations .mono {
		grid-row: span 2;
		padding-top: 0.35em;
		color: var(--color-accent);
	}
	.price {
		display: grid;
		justify-items: start;
		gap: var(--space-3);
		margin-bottom: var(--space-7);
		padding: var(--space-5);
		border: 1px solid var(--color-line);
		background: var(--color-surface);
	}
	.price p {
		margin: 0;
	}
	.price-line {
		max-width: 30ch;
		font-size: var(--text-xl);
		line-height: 1.1;
		letter-spacing: -0.03em;
	}
	.price strong {
		color: var(--color-accent);
		font-weight: 600;
	}
</style>
