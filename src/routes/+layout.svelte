<script lang="ts">
	import '@fontsource-variable/geist';
	import '@fontsource-variable/geist-mono';
	import '#lib/styles/tokens.css';
	import '#lib/styles/base.css';
	import { onNavigate } from '$app/navigation';
	import AfCursor from '#lib/components/AfCursor.svelte';
	import Grain from '#lib/components/Grain.svelte';

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

{@render children()}

<AfCursor />
<Grain />
