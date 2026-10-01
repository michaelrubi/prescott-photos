<script lang="ts">
	import { page } from '$app/state';
	import { nav, site } from '#lib/site.ts';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';
</script>

<header>
	<a class="mark" href="/" aria-label="{site.name}, home">
		<Logo />
		<span class="wordmark">
			<span class="name">{site.brand.name}</span>
			<span class="tagline">{site.brand.tagline}</span>
		</span>
	</a>
	<nav aria-label="Main">
		<ul>
			{#each nav as link (link.href)}
				<li>
					<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	<Button href="/book">Book</Button>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--gutter);
		background: color-mix(in oklab, var(--color-bg), transparent 15%);
		backdrop-filter: blur(12px);
		view-transition-name: site-header;
		border-bottom: 1px solid var(--color-line);
	}
	.mark {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
	}
	.mark :global(.logo) {
		width: 2.5rem;
		height: 2.5rem;
	}
	.wordmark {
		display: grid;
		gap: 0.3rem;
	}
	.name {
		font-size: 1.0625rem;
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.03em;
	}
	.tagline {
		font: 500 0.5625rem / 1 var(--font-mono);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-accent);
	}
	nav {
		margin-left: auto;
	}
	ul {
		display: flex;
		gap: var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	nav a {
		position: relative;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color var(--duration-fast);
	}
	nav a::after {
		content: '';
		position: absolute;
		inset: auto 0 -0.35em 0;
		height: 1px;
		background: var(--color-accent);
		transform: scaleX(0);
		transform-origin: right;
		transition: transform var(--duration-base) var(--ease-focus);
	}
	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--color-text);
	}
	nav a:hover::after,
	nav a[aria-current='page']::after {
		transform: scaleX(1);
		transform-origin: left;
	}

	@media (max-width: 40rem) {
		header {
			gap: var(--space-3);
		}
		.wordmark {
			display: none;
		}
		ul {
			gap: var(--space-3);
		}
		nav a {
			font-size: var(--text-xs);
		}
	}
</style>
