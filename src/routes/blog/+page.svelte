<script lang="ts">
	import CallToBook from '#lib/components/CallToBook.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import PageIntro from '#lib/components/PageIntro.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { reveal } from '#lib/motion/reveal.ts';
	import { pictures } from '#lib/photos.ts';
	import { formatDate } from '#lib/posts.ts';
	import { breadcrumbs } from '#lib/schema.ts';

	let { data } = $props();
</script>

<Seo
	title="Blog | Prescott Photo, Prescott AZ"
	description="Location guides, session planning and portrait tips from Michael Rubi, a portrait photographer in Prescott, Arizona."
	noindex={data.posts.length === 0}
	jsonld={[{ '@type': 'Blog', name: 'Prescott Photo Blog' }, breadcrumbs([{ name: 'Blog', path: '/blog' }])]}
/>

<main>
	<PageIntro
		label="Blog"
		title={'Notes from\nbehind the camera.'}
		lead="Where to shoot around Prescott, what to wear, and how to plan a session you'll love."
	/>

	{#if data.posts.length}
		<ul class="posts" {@attach reveal({ stagger: 0.08 })}>
			{#each data.posts as post (post.slug)}
				<li>
					<a href="/blog/{post.slug}">
						<Frame label={post.coverAlt} tone="granite" ratio="3 / 2">
							{#if post.cover}
								<enhanced:img
									src={pictures[post.cover]}
									alt=""
									sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 90vw"
								/>
							{/if}
						</Frame>
						<p class="mono">
							<time datetime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min read
							{#if post.draft}<span class="draft">Draft</span>{/if}
						</p>
						<h2>{post.title}</h2>
						<p class="description">{post.description}</p>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">The first posts are on their way.</p>
	{/if}

	<CallToBook />
</main>

<style>
	main {
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 var(--gutter);
	}
	p {
		margin: 0;
	}
	.posts {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
		gap: var(--space-6) var(--space-4);
		margin: 0;
		padding: 0 0 var(--space-7);
		list-style: none;
	}
	.posts a {
		display: grid;
		gap: var(--space-2);
		text-decoration: none;
	}
	.posts :global(picture),
	.posts :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-base) var(--ease-focus);
	}
	.posts a:hover :global(img) {
		transform: scale(1.02);
	}
	.mono {
		margin-top: var(--space-2);
		color: var(--color-text-muted);
	}
	.draft {
		margin-left: var(--space-2);
		padding: 0.1em 0.5em;
		border: 1px solid var(--color-accent);
		color: var(--color-accent);
	}
	h2 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}
	.posts a:hover h2 {
		color: var(--color-accent);
	}
	.description {
		max-width: 50ch;
		color: var(--color-text-muted);
	}
	.empty {
		padding-bottom: var(--space-7);
		color: var(--color-text-muted);
	}
</style>
