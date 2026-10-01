<!-- A numbered section heading: "02 · How it works" over a large title. -->
<script lang="ts">
	let { label, title, id }: { label: string; title: string; id?: string } = $props();
</script>

<header>
	<p class="mono">{label}</p>
	<h2 {id}>{title}</h2>
</header>

<style>
	header {
		display: grid;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}
	p {
		margin: 0;
	}
	h2 {
		margin: 0;
		max-width: 20ch;
		font-size: var(--text-xl);
		line-height: 1.05;
		letter-spacing: -0.03em;
		font-weight: 600;
	}
</style>
