<!-- Questions and answers as native disclosure widgets, so they work without JavaScript. -->
<script lang="ts">
	import type { Faq } from '#lib/content.ts';

	let { faqs }: { faqs: Faq[] } = $props();
</script>

<div class="faq">
	{#each faqs as faq (faq.q)}
		<details>
			<summary>
				<span>{faq.q}</span>
				<span class="icon" aria-hidden="true"></span>
			</summary>
			<p>{faq.a}</p>
		</details>
	{/each}
</div>

<style>
	.faq {
		border-top: 1px solid var(--color-line);
	}
	details {
		border-bottom: 1px solid var(--color-line);
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: 500;
		letter-spacing: -0.015em;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover {
		color: var(--color-accent);
	}
	.icon {
		position: relative;
		flex: none;
		width: 0.9rem;
		height: 0.9rem;
	}
	.icon::before,
	.icon::after {
		content: '';
		position: absolute;
		inset: 50% 0 auto;
		height: 1.5px;
		background: currentColor;
		transition: transform var(--duration-base) var(--ease-focus);
	}
	.icon::after {
		transform: rotate(90deg);
	}
	details[open] .icon::after {
		transform: rotate(0deg);
	}
	p {
		margin: 0;
		padding: 0 0 var(--space-4);
		max-width: 60ch;
		color: var(--color-text-muted);
	}
</style>
