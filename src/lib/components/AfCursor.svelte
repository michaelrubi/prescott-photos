<!--
	Autofocus reticle. With a mouse, hovering anything marked `data-af`
	(the photos) makes a set of focus brackets fly from the pointer and lock
	onto that frame, the way a camera's AF point grabs a subject. A small
	crosshair replaces the arrow while it's locked. Nothing renders on touch
	screens or for reduced-motion visitors.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { finePointer, loadMotion, reducedMotion } from '#lib/motion/gsap.ts';

	let enabled = $state(false);
	let reticle: HTMLElement | undefined = $state();
	let crosshair: HTMLElement | undefined = $state();
	let locked = $state(false);

	onMount(() => {
		if (!finePointer() || reducedMotion()) return;
		enabled = true;
		let target: HTMLElement | null = null;
		let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
		let teardown = () => {};

		loadMotion().then(({ gsap }) => {
			if (!reticle || !crosshair) return;
			document.documentElement.classList.add('has-af');
			const IDLE = 28;
			gsap.set(reticle, { width: IDLE, height: IDLE, x: pointer.x - IDLE / 2, y: pointer.y - IDLE / 2, autoAlpha: 0 });

			const cx = gsap.quickTo(crosshair, 'x', { duration: 0.15, ease: 'power3' });
			const cy = gsap.quickTo(crosshair, 'y', { duration: 0.15, ease: 'power3' });

			const follow = () => {
				if (target) {
					const r = target.getBoundingClientRect();
					const inset = 10;
					gsap.to(reticle!, {
						x: r.left + inset,
						y: r.top + inset,
						width: r.width - inset * 2,
						height: r.height - inset * 2,
						duration: 0.45,
						ease: 'expo.out',
						overwrite: 'auto'
					});
				} else {
					gsap.to(reticle!, {
						x: pointer.x - IDLE / 2,
						y: pointer.y - IDLE / 2,
						width: IDLE,
						height: IDLE,
						duration: 0.35,
						ease: 'power3.out',
						overwrite: 'auto'
					});
				}
			};

			const onMove = (e: PointerEvent) => {
				pointer = { x: e.clientX, y: e.clientY };
				cx(e.clientX);
				cy(e.clientY);
				const next = (e.target as Element | null)?.closest<HTMLElement>('[data-af]') ?? null;
				if (next !== target) {
					target = next;
					locked = !!target;
					gsap.to(reticle!, { autoAlpha: target ? 1 : 0, duration: target ? 0.15 : 0.3 });
					gsap.to(crosshair!, { autoAlpha: target ? 1 : 0, duration: 0.15 });
					follow();
				} else if (!target) {
					follow();
				}
			};
			// Keep the brackets on the photo while the page scrolls under them
			const onScroll = () => target && follow();
			const onLeave = () => {
				target = null;
				locked = false;
				gsap.to([reticle!, crosshair!], { autoAlpha: 0, duration: 0.2 });
			};

			addEventListener('pointermove', onMove, { passive: true });
			addEventListener('scroll', onScroll, { passive: true });
			document.addEventListener('pointerleave', onLeave);
			teardown = () => {
				removeEventListener('pointermove', onMove);
				removeEventListener('scroll', onScroll);
				document.removeEventListener('pointerleave', onLeave);
				document.documentElement.classList.remove('has-af');
			};
		});

		return () => teardown();
	});
</script>

{#if enabled}
	<div class="reticle" class:locked bind:this={reticle} aria-hidden="true">
		<span class="c tl"></span>
		<span class="c tr"></span>
		<span class="c bl"></span>
		<span class="c br"></span>
		<span class="status mono"><span class="dot"></span>AF-C · Lock</span>
	</div>
	<div class="crosshair" bind:this={crosshair} aria-hidden="true"></div>
{/if}

<style>
	.reticle {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 50;
		pointer-events: none;
		visibility: hidden;
	}
	.c {
		position: absolute;
		width: 14px;
		height: 14px;
		border: 0 solid var(--color-text);
		transition: border-color var(--duration-fast);
	}
	.locked .c {
		border-color: var(--color-accent);
	}
	.tl { top: 0; left: 0; border-top-width: 1.5px; border-left-width: 1.5px; }
	.tr { top: 0; right: 0; border-top-width: 1.5px; border-right-width: 1.5px; }
	.bl { bottom: 0; left: 0; border-bottom-width: 1.5px; border-left-width: 1.5px; }
	.br { bottom: 0; right: 0; border-bottom-width: 1.5px; border-right-width: 1.5px; }

	.status {
		position: absolute;
		top: 0.6rem;
		left: 1.4rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: #fff;
		text-shadow: 0 1px 4px rgb(0 0 0 / 0.5);
		opacity: 0;
		transition: opacity var(--duration-fast) 120ms;
	}
	.locked .status {
		opacity: 1;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-accent);
		animation: blink 1.2s steps(2, jump-none) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0.2;
		}
	}

	.crosshair {
		position: fixed;
		top: -8px;
		left: -8px;
		z-index: 51;
		width: 16px;
		height: 16px;
		pointer-events: none;
		visibility: hidden;
		background:
			linear-gradient(var(--color-accent), var(--color-accent)) center / 1.5px 100% no-repeat,
			linear-gradient(var(--color-accent), var(--color-accent)) center / 100% 1.5px no-repeat;
	}

	:global(html.has-af [data-af]) {
		cursor: none;
	}
</style>
