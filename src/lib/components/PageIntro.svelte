<!-- The opening block of an inner page: mono label, big heading, lead paragraph. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, title, lead, children }: { label: string; title: string; lead?: string; children?: Snippet } =
		$props();
</script>

<header class="intro">
	<p class="mono">{label}</p>
	<h1>
		{#each title.split('\n') as line, i (i)}
			<span class="line"><span>{line}</span></span>
		{/each}
	</h1>
	{#if lead}<p class="lead">{lead}</p>{/if}
	{#if children}<div class="actions">{@render children()}</div>{/if}
</header>

<style>
	.intro {
		display: grid;
		justify-items: start;
		gap: var(--space-4);
		padding: var(--space-7) 0 var(--space-6);
	}
	p {
		margin: 0;
	}
	h1 {
		margin: 0;
		max-width: 16ch;
		font-size: var(--text-display);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-tight);
		font-weight: 600;
	}
	.line {
		display: block;
		overflow: hidden;
		padding-bottom: 0.06em;
	}
	.line > span {
		display: inline-block;
	}
	.lead {
		max-width: 46ch;
		font-size: var(--text-lg);
		color: var(--color-text-muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	:global(html.motion) .line > span {
		animation: rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	:global(html.motion) .line:nth-child(2) > span {
		animation-delay: 0.08s;
	}
	:global(html.motion) .line:nth-child(3) > span {
		animation-delay: 0.16s;
	}
	:global(html.motion) .lead,
	:global(html.motion) .actions {
		animation: fade 0.8s ease 0.3s both;
	}
	@keyframes rise {
		from {
			transform: translateY(105%);
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
</style>
