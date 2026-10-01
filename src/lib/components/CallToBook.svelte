<!-- The closing invitation at the end of a page. -->
<script lang="ts">
	import Button from './Button.svelte';

	let {
		label = 'Your turn',
		title = 'Ready when you are.',
		body = "Sessions are relaxed and guided, around Prescott and northern Arizona. Tell me what you have in mind and I'll take it from there.",
		href = '/book'
	}: { label?: string; title?: string; body?: string; href?: string } = $props();
</script>

<section class="cta">
	<p class="mono">{label}</p>
	<h2>{title}</h2>
	<p class="body">{body}</p>
	<Button {href}>Book a session</Button>
</section>

<style>
	.cta {
		display: grid;
		justify-items: start;
		gap: var(--space-4);
		padding: var(--space-7) 0;
		border-top: 1px solid var(--color-line);
	}
	p {
		margin: 0;
	}
	h2 {
		margin: 0;
		font-size: var(--text-display);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
	.body {
		max-width: 44ch;
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}
</style>
