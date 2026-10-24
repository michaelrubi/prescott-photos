<script lang="ts">
	import CallToBook from '#lib/components/CallToBook.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { pictures } from '#lib/photos.ts';
	import { formatDate } from '#lib/posts.ts';
	import { blogPosting, breadcrumbs } from '#lib/schema.ts';

	let { data } = $props();
	const post = $derived(data.post);
</script>

<Seo
	title="{post.title} | Prescott Photo"
	description={post.description}
	noindex={post.draft}
	article={{ published: post.date, modified: post.updated }}
	jsonld={[
		blogPosting(post, data.shareImage),
		breadcrumbs([
			{ name: 'Blog', path: '/blog' },
			{ name: post.title, path: `/blog/${post.slug}` }
		])
	]}
/>

<main>
	<article>
		<header>
			<p class="mono">
				<a href="/blog">Blog</a> · <time datetime={post.date}>{formatDate(post.date)}</time> · {post.minutes} min
				read
				{#if post.draft}<span class="draft">Draft</span>{/if}
			</p>
			<h1>{post.title}</h1>
			<p class="lead">{post.description}</p>
			<p class="byline">By <a href="/about">Michael Rubi</a></p>
		</header>

		{#if post.cover}
			<div class="cover">
				<Frame label={post.coverAlt} tone="granite" ratio="3 / 2">
					<enhanced:img src={pictures[post.cover]} alt="" sizes="(min-width: 72rem) 70rem, 95vw" fetchpriority="high" />
				</Frame>
			</div>
		{/if}

		<div class="prose">
			{#each post.body as segment, i (i)}
				{#if segment.type === 'html'}
					{@html segment.html}
				{:else}
					<figure class="photo">
						<enhanced:img src={pictures[segment.path]} alt={segment.alt} sizes="(min-width: 56rem) 52rem, 95vw" loading="lazy" />
						{#if segment.caption}<figcaption class="mono">{segment.caption}</figcaption>{/if}
					</figure>
				{/if}
			{/each}
		</div>
	</article>

	{#if data.more.length}
		<nav class="more" aria-labelledby="more">
			<p class="mono" id="more">More from the blog</p>
			<ul>
				{#each data.more as p (p.slug)}
					<li>
						<a href="/blog/{p.slug}">{p.title}</a>
						<span class="mono">{formatDate(p.date)}</span>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}

	<CallToBook title="Want to shoot here?" />
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
	header {
		display: grid;
		gap: var(--space-4);
		max-width: 52rem;
		margin: 0 auto;
		padding: var(--space-7) 0 var(--space-5);
	}
	header .mono {
		color: var(--color-text-muted);
	}
	header .mono a {
		color: var(--color-accent);
		text-decoration: none;
	}
	.draft {
		margin-left: var(--space-2);
		padding: 0.1em 0.5em;
		border: 1px solid var(--color-accent);
		color: var(--color-accent);
	}
	h1 {
		margin: 0;
		font-size: clamp(2.25rem, 1.25rem + 4vw, 4.5rem);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
		text-wrap: balance;
	}
	.lead {
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}
	.byline {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
	.byline a {
		color: var(--color-text);
	}
	.cover {
		max-width: 70rem;
		margin: 0 auto var(--space-6);
	}
	.cover :global(picture),
	.cover :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.prose {
		max-width: 40rem;
		margin: 0 auto;
		padding-bottom: var(--space-7);
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--color-text-muted);
	}
	.prose :global(:where(p, ul, ol, blockquote)) {
		margin: 0 0 var(--space-4);
	}
	.prose :global(h2) {
		margin: var(--space-6) 0 var(--space-3);
		font-size: var(--text-xl);
		line-height: 1.15;
		letter-spacing: -0.03em;
		font-weight: 600;
		color: var(--color-text);
		text-wrap: balance;
	}
	.prose :global(h3) {
		margin: var(--space-5) 0 var(--space-2);
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--color-text);
	}
	.prose :global(strong) {
		color: var(--color-text);
		font-weight: 600;
	}
	.prose :global(a) {
		color: var(--color-text);
		text-decoration-color: var(--color-accent);
		text-underline-offset: 0.2em;
	}
	.prose :global(li + li) {
		margin-top: var(--space-2);
	}
	.prose :global(li::marker) {
		color: var(--color-accent);
	}
	.prose :global(blockquote) {
		padding-left: var(--space-3);
		border-left: 2px solid var(--color-accent);
		color: var(--color-text);
	}
	.photo {
		display: grid;
		gap: var(--space-2);
		margin: var(--space-5) 0;
	}
	.photo :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}
	figcaption {
		color: var(--color-text-muted);
	}

	.more {
		display: grid;
		gap: var(--space-3);
		max-width: 40rem;
		margin: 0 auto;
		padding-bottom: var(--space-7);
	}
	.more ul {
		display: grid;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.more li {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-line);
	}
	.more a {
		font-weight: 500;
		text-decoration: none;
	}
	.more a:hover {
		color: var(--color-accent);
	}
	.more .mono {
		color: var(--color-text-muted);
	}
</style>
