<!--
	Camera-style readout pinned to the bottom of the screen: the frame you're
	looking at (`07 / 18`) and a light-meter scale that tracks how far down
	the page you are.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let { selector, total }: { selector: string; total: number } = $props();

	let frame = $state(1);
	let progress = $state(0);
	let visible = $state(false);

	const pad = (n: number) => String(n).padStart(2, '0');
	const ticks = [-3, -2, -1, 0, 1, 2, 3];

	onMount(() => {
		let raf = 0;
		const update = () => {
			raf = 0;
			const max = document.documentElement.scrollHeight - innerHeight;
			progress = max > 0 ? Math.min(1, scrollY / max) : 0;
			visible = scrollY > 120;
			const middle = innerHeight / 2;
			let best = 0;
			let bestDistance = Infinity;
			document.querySelectorAll(selector).forEach((el, i) => {
				const r = el.getBoundingClientRect();
				const distance = Math.abs(r.top + r.height / 2 - middle);
				if (distance < bestDistance) {
					bestDistance = distance;
					best = i;
				}
			});
			frame = best + 1;
		};
		const schedule = () => (raf ||= requestAnimationFrame(update));
		addEventListener('scroll', schedule, { passive: true });
		addEventListener('resize', schedule);
		update();
		return () => {
			removeEventListener('scroll', schedule);
			removeEventListener('resize', schedule);
			cancelAnimationFrame(raf);
		};
	});
</script>

<div class="hud mono" class:visible aria-hidden="true">
	<span class="frame">{pad(Math.min(frame, total))} <span class="of">/ {pad(total)}</span></span>
	<span class="meter">
		{#each ticks as t (t)}
			<span class="tick" class:zero={t === 0}>{t > 0 ? `+${t}` : t}</span>
		{/each}
		<span class="needle" style:left="{progress * 100}%"></span>
	</span>
</div>

<style>
	.hud {
		position: fixed;
		left: 50%;
		bottom: var(--space-3);
		z-index: 30;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0.6rem 1rem;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: color-mix(in oklab, var(--color-bg), transparent 25%);
		backdrop-filter: blur(10px);
		color: var(--color-text);
		transform: translate(-50%, 150%);
		opacity: 0;
		transition:
			transform var(--duration-base) var(--ease-focus),
			opacity var(--duration-base);
		pointer-events: none;
	}
	.visible {
		transform: translate(-50%, 0);
		opacity: 1;
	}
	.frame {
		min-width: 5.5ch;
		font-variant-numeric: tabular-nums;
	}
	.of {
		color: var(--color-text-muted);
	}
	.meter {
		position: relative;
		display: flex;
		gap: 0.9rem;
		color: var(--color-text-muted);
		font-size: 0.625rem;
	}
	.tick.zero {
		color: var(--color-text);
	}
	.needle {
		position: absolute;
		top: -0.45rem;
		width: 1px;
		height: calc(100% + 0.9rem);
		background: var(--color-accent);
		transition: left 120ms linear;
	}
	@media (max-width: 30rem) {
		.meter {
			display: none;
		}
	}
</style>
