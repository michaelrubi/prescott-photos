<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href,
		variant = 'primary',
		type = 'button',
		children
	}: {
		href?: string;
		variant?: 'primary' | 'ghost';
		type?: 'button' | 'submit';
		children: Snippet;
	} = $props();
</script>

{#if href}
	<a class="button {variant}" {href}>{@render children()}</a>
{:else}
	<button class="button {variant}" {type}>{@render children()}</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0.8em 1.4em;
		border: 1px solid transparent;
		border-radius: 999px;
		font: 500 var(--text-sm) / 1 var(--font-sans);
		letter-spacing: 0.01em;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--duration-fast) var(--ease-focus),
			color var(--duration-fast) var(--ease-focus),
			border-color var(--duration-fast) var(--ease-focus);
	}
	.primary {
		background: var(--color-accent);
		color: var(--color-accent-text);
	}
	.primary:hover {
		background: color-mix(in oklab, var(--color-accent), white 18%);
	}
	.ghost {
		background: transparent;
		color: var(--color-text);
		border-color: var(--color-line);
	}
	.ghost:hover {
		border-color: var(--color-text-muted);
	}
</style>
