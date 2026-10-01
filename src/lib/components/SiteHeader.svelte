<script lang="ts">
	import { page } from '$app/state';
	import Button from './Button.svelte';

	const links = [
		{ href: '/portraits', label: 'Portraits' },
		{ href: '/work', label: 'Work' },
		{ href: '/sessions', label: 'Sessions' },
		{ href: '/about', label: 'About' }
	];
</script>

<header>
	<a class="mark" href="/" aria-label="Michael Rubi Photography, home">
		<svg viewBox="0 0 32 32" aria-hidden="true">
			<path d="M7 11V7h4M21 7h4v4M25 21v4h-4M11 25H7v-4" fill="none" stroke="currentColor" stroke-width="2" />
			<circle cx="16" cy="16" r="2" fill="currentColor" />
		</svg>
		<span>Michael Rubi</span>
	</a>
	<nav aria-label="Main">
		<ul>
			{#each links as link (link.href)}
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
		gap: var(--space-2);
		font-weight: 600;
		letter-spacing: -0.01em;
		text-decoration: none;
	}
	.mark svg {
		width: 1.5rem;
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
		.mark span {
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
