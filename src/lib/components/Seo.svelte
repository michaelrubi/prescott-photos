<!--
	Per-page title, description, canonical URL, social card and structured
	data. Every page renders exactly one of these.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { site } from '#lib/site.ts';

	let {
		title,
		description,
		image,
		noindex = false,
		jsonld = []
	}: {
		title: string;
		description: string;
		/** Root-relative URL of a 1200×630 image */
		image?: string;
		noindex?: boolean;
		jsonld?: object[];
	} = $props();

	const url = $derived(site.url + (page.url.pathname === '/' ? '' : page.url.pathname));
	const imageUrl = $derived.by(() => {
		const src = image ?? (page.data.shareImage as string | undefined);
		return src && new URL(src, site.url).href;
	});
	// `<` is escaped so the JSON can never close the script tag early
	const scripts = $derived(
		jsonld.map(
			(data) =>
				`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</` +
				'script>'
		)
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<link rel="canonical" href={url} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content={site.locale} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	{#each scripts as script, i (i)}
		{@html script}
	{/each}
</svelte:head>
