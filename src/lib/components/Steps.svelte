<!-- How a session works, as numbered steps on a hairline grid. -->
<script lang="ts">
	import { steps } from '#lib/content.ts';
	import { reveal } from '#lib/motion/reveal.ts';
</script>

<ol {@attach reveal({ stagger: 0.1 })}>
	{#each steps as step, i (step.title)}
		<li>
			<span class="mono">Step {String(i + 1).padStart(2, '0')}</span>
			<h3>{step.title}</h3>
			<p>{step.body}</p>
		</li>
	{/each}
</ol>

<style>
	ol {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--color-line);
	}
	li {
		display: grid;
		align-content: start;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-4) var(--space-4) 0;
		border-bottom: 1px solid var(--color-line);
	}
	.mono {
		color: var(--color-accent);
	}
	h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	p {
		margin: 0;
		color: var(--color-text-muted);
	}
</style>
