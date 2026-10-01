<script lang="ts">
	import { site } from '#lib/site.ts';
</script>

<svelte:head>
	<title>Portrait Photographer in Prescott, AZ | Michael Rubi</title>
	<meta
		name="description"
		content="Modern portrait photography in Prescott, Arizona by Michael Rubi. Solo portraits, couples and families."
	/>
	<link rel="canonical" href={site.url} />
</svelte:head>

<main>
	<p class="mono">{site.region}</p>
	<h1>{site.name}</h1>
	<p class="mono">New site in progress</p>
	<nav class="preview" aria-label="Preview pages">
		<a href="/work">Portfolio</a>
		<a href="/style">Style guide</a>
	</nav>
</main>

<style>
	main {
		min-height: 100svh;
		display: grid;
		place-content: center;
		gap: var(--space-3);
		padding: var(--gutter);
		text-align: center;
	}

	.preview {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
	}
	.preview a {
		color: var(--color-accent);
		text-underline-offset: 0.25em;
	}

	h1 {
		margin: 0;
		font-size: var(--text-display);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
</style>
