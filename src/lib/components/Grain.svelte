<!-- A faint, moving film-grain layer over the whole page. Purely visual. -->
<div class="grain" aria-hidden="true"></div>

<style>
	.grain {
		position: fixed;
		inset: -50%;
		z-index: 40;
		pointer-events: none;
		opacity: 0.07;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		animation: grain 0.9s steps(6) infinite;
	}
	@keyframes grain {
		0% { transform: translate(0, 0); }
		20% { transform: translate(-4%, 3%); }
		40% { transform: translate(3%, -5%); }
		60% { transform: translate(-6%, -2%); }
		80% { transform: translate(5%, 4%); }
		100% { transform: translate(0, 0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.grain {
			animation: none;
		}
	}
</style>
