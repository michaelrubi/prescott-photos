<script lang="ts">
	import { onMount } from 'svelte';
	import FrameHud from '#lib/components/FrameHud.svelte';
	import Gallery from '#lib/components/Gallery.svelte';
	import { categories, type Category } from '#lib/photos.ts';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();

	let active = $state<Category | 'all'>('all');
	const shown = $derived(active === 'all' ? data.photos : data.photos.filter((p) => p.category === active));

	const count = (id: string) =>
		id === 'all' ? data.photos.length : data.photos.filter((p) => p.category === id).length;
	// Categories without photos yet stay out of the filter
	const filters = [{ id: 'all', label: 'All' } as const, ...categories.filter((c) => count(c.id) > 0)];

	// The filter lives in ?category= so a filtered view can be linked to
	onMount(() => {
		const param = new URLSearchParams(location.search).get('category');
		if (categories.some((c) => c.id === param)) active = param as Category;
	});

	function choose(id: Category | 'all') {
		active = id;
		const url = new URL(location.href);
		if (id === 'all') url.searchParams.delete('category');
		else url.searchParams.set('category', id);
		url.hash = '';
		history.replaceState(history.state, '', url);
	}
</script>

<Seo
	title="Portfolio | Michael Rubi Photography, Prescott AZ"
	description="Portrait, couple and family photography by Michael Rubi in Prescott, Arizona. Browse the full portfolio."
/>


<main>
	<header class="intro">
		<p class="mono">Work · {pad(data.photos.length)} frames</p>
		<h1>Portfolio</h1>
		<div class="filters" role="group" aria-label="Filter by session type">
			{#each filters as filter (filter.id)}
				<button
					type="button"
					class="chip"
					aria-pressed={active === filter.id}
					onclick={() => choose(filter.id)}
				>
					{filter.label}
					<span class="mono">{pad(count(filter.id))}</span>
				</button>
			{/each}
		</div>
	</header>

	<Gallery photos={shown} />
</main>

<FrameHud selector=".grid .item" total={shown.length} />

<script lang="ts" module>
	function pad(n: number) {
		return String(n).padStart(2, '0');
	}
</script>

<style>
	main {
		padding: 0 var(--gutter) var(--space-7);
	}
	.intro {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-6) 0 var(--space-5);
	}
	.intro p {
		margin: 0;
	}
	h1 {
		margin: 0;
		font-size: var(--text-display);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.55em 1em;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: transparent;
		color: var(--color-text-muted);
		font: 500 var(--text-sm) / 1 var(--font-sans);
		cursor: pointer;
		transition:
			border-color var(--duration-fast),
			color var(--duration-fast);
	}
	.chip:hover {
		color: var(--color-text);
	}
	.chip[aria-pressed='true'] {
		border-color: var(--color-accent);
		color: var(--color-text);
	}
	.chip .mono {
		color: inherit;
		opacity: 0.6;
	}
</style>
