<script lang="ts">
	import CallToBook from '#lib/components/CallToBook.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import PageIntro from '#lib/components/PageIntro.svelte';
	import SectionHead from '#lib/components/SectionHead.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { testimonials } from '#lib/content.ts';
	import { reveal } from '#lib/motion/reveal.ts';
	import { person } from '#lib/schema.ts';

	const principles = [
		{
			title: 'Calm is contagious',
			body: "Fourteen years in the Air Force taught me to stay steady when plans change. If I'm relaxed, you will be too."
		},
		{
			title: "Prepared, so you don't have to be",
			body: 'I scout locations, check the light and plan poses before we meet. On the day, all you need to do is show up.'
		},
		{
			title: 'Honest retouching',
			body: "I clean up what's temporary and leave what's you. No plastic skin, no new face, just you on a very good day."
		}
	];
</script>

<Seo
	title="About Michael Rubi | Portrait Photographer in Prescott, AZ"
	description="Michael Rubi is a portrait photographer in Prescott, Arizona and a 14-year US Air Force veteran who makes being photographed feel easy."
	jsonld={[{ '@type': 'AboutPage', mainEntity: person }]}
/>

<main>
	<PageIntro
		label="About"
		title={"Hi, I'm Michael."}
		lead="Portrait photographer, Air Force veteran and Prescott local by marriage."
	/>

	<section class="story">
		<div class="portrait">
			<Frame label="Portrait of Michael Rubi" tone="dusk" ratio="4 / 5" />
		</div>
		<div class="copy" {@attach reveal({ stagger: 0.08 })}>
			<p class="first">
				I photograph people in and around Prescott, Arizona: headshots, personal branding, seniors, couples and
				families. Mostly, I photograph people who would tell you they're not photogenic.
			</p>
			<p>
				Photography started for me during fourteen years in the United States Air Force, as a way to remember the
				places I was stationed and the people I met there. Over time I noticed the people mattered more than the
				places, and the camera became how I got to know them.
			</p>
			<p>
				The service taught me things I still use on every shoot: plan the details, stay calm when things change,
				read the room, and be patient enough for the real moment to show up. That's usually the one you end up
				framing.
			</p>
			<p>
				After the Air Force, my family and I settled in Prescott, the town my wife has always called home. Granite
				dells, pine forest and a brick downtown, all within twenty minutes. I couldn't ask for a better backdrop.
			</p>
			<p>
				When I'm not behind the camera, I'm with my wife and daughter, or at the gym trying to outwork my diet.
			</p>
		</div>
	</section>

	<section aria-labelledby="approach">
		<SectionHead id="approach" label="01 · How I work" title="Three things you can count on." />
		<ol class="principles" {@attach reveal({ stagger: 0.1 })}>
			{#each principles as p, i (p.title)}
				<li>
					<span class="mono">{String(i + 1).padStart(2, '0')}</span>
					<h3>{p.title}</h3>
					<p>{p.body}</p>
				</li>
			{/each}
		</ol>
	</section>

	{#each testimonials as t (t.name)}
		<figure class="quote" {@attach reveal()}>
			<blockquote>“{t.quote}”</blockquote>
			<figcaption class="mono">{t.name}</figcaption>
		</figure>
	{/each}

	<CallToBook title="Let's make one you'll keep." />
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
	p {
		margin: 0;
	}
	.story {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		gap: var(--space-6);
		align-items: start;
	}
	.portrait {
		position: sticky;
		top: 6rem;
	}
	.copy {
		display: grid;
		gap: var(--space-4);
		max-width: 60ch;
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}
	.copy .first {
		font-size: var(--text-xl);
		line-height: 1.2;
		letter-spacing: -0.025em;
		color: var(--color-text);
	}
	.principles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.principles li {
		display: grid;
		align-content: start;
		gap: var(--space-2);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-line);
	}
	.principles .mono {
		color: var(--color-accent);
	}
	h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.principles p {
		color: var(--color-text-muted);
	}
	.quote {
		display: grid;
		gap: var(--space-4);
		margin: 0;
		padding-bottom: var(--space-7);
	}
	blockquote {
		margin: 0;
		max-width: 30ch;
		font-size: clamp(1.5rem, 1rem + 2vw, 2.75rem);
		line-height: 1.15;
		letter-spacing: -0.03em;
		font-weight: 500;
	}
	figcaption::before {
		content: '— ';
		color: var(--color-accent);
	}

	@media (max-width: 48rem) {
		.story {
			grid-template-columns: 1fr;
		}
		.portrait {
			position: static;
			max-width: 24rem;
		}
	}
</style>
