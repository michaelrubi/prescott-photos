<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist-mono';
	import '#lib/styles/tokens.css';
	import '#lib/styles/base.css';
	import { onNavigate } from '$app/navigation';
	import AfCursor from '#lib/components/AfCursor.svelte';
	import Grain from '#lib/components/Grain.svelte';
	import SiteFooter from '#lib/components/SiteFooter.svelte';
	import SiteHeader from '#lib/components/SiteHeader.svelte';

	let { children } = $props();

	// Cross-fade between pages with the View Transitions API where supported
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<SiteHeader />

{@render children()}

<SiteFooter />

<AfCursor />
<Grain />
