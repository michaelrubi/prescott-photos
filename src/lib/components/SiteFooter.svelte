<script lang="ts">
	import { nav, site } from '#lib/site.ts';

	const year = new Date().getFullYear();
</script>

<footer>
	<div class="brand">
		<a class="name" href="/">Michael Rubi</a>
		<p>Portrait photographer in Prescott, Arizona. Serving {site.serviceArea.slice(1, -1).join(', ')} and {site
				.serviceArea.at(-1)}.</p>
	</div>

	<nav aria-label="Footer">
		<div>
			<p class="mono">Explore</p>
			<ul>
				<li><a href="/">Home</a></li>
				{#each nav as link (link.href)}
					<li><a href={link.href}>{link.label}</a></li>
				{/each}
			</ul>
		</div>
		<div>
			<p class="mono">Connect</p>
			<ul>
				<li><a href="/book">Book a session</a></li>
				<li><a href={site.social.instagram} rel="me noopener" target="_blank">Instagram</a></li>
				<li><a href={site.social.facebook} rel="me noopener" target="_blank">Facebook</a></li>
			</ul>
		</div>
	</nav>

	<div class="legal mono">
		<span>© {year} {site.legalName}</span>
		<span class="links"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></span>
	</div>
</footer>

<style>
	footer {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: var(--space-6) var(--space-5);
		padding: var(--space-6) var(--gutter) var(--space-4);
		border-top: 1px solid var(--color-line);
	}
	p {
		margin: 0;
	}
	.brand {
		display: grid;
		align-content: start;
		gap: var(--space-2);
		max-width: 30ch;
		color: var(--color-text-muted);
	}
	.name {
		font-size: var(--text-xl);
		font-weight: 600;
		letter-spacing: -0.03em;
		color: var(--color-text);
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: var(--space-6);
	}
	ul {
		display: grid;
		gap: var(--space-1);
		margin: var(--space-3) 0 0;
		padding: 0;
		list-style: none;
	}
	nav a,
	.legal a {
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color var(--duration-fast);
	}
	nav a:hover,
	.legal a:hover {
		color: var(--color-text);
	}
	.legal {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-3);
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-line);
	}
	.links {
		display: flex;
		gap: var(--space-4);
	}

	@media (max-width: 40rem) {
		footer {
			grid-template-columns: 1fr;
		}
	}
</style>
