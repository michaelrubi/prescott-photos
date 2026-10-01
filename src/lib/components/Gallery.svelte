<!--
	Justified photo grid: each row fills the width and every photo keeps its
	shape, like a contact sheet. Tapping a photo opens the full-screen viewer.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { pictures, type PhotoMeta } from '#lib/photos.ts';
	import { openViewer, type ViewerHandle } from '#lib/viewer.ts';
	import { loadMotion, reducedMotion, type Motion } from '#lib/motion/gsap.ts';

	let { photos }: { photos: PhotoMeta[] } = $props();

	let grid: HTMLElement;
	let viewer: ViewerHandle | undefined;
	let motion: Motion | undefined;
	let flipState: ReturnType<Motion['Flip']['getState']> | undefined;
	let watchNewItems: (() => void) | undefined;

	const largest = (photo: PhotoMeta) => pictures[photo.path].img.src;
	const items = () => Array.from(grid.querySelectorAll<HTMLElement>('.item'));

	onMount(() => {
		viewer = openViewer(grid, () => photos);
		let ctx: gsap.Context | undefined;

		if (!reducedMotion()) {
			loadMotion().then((m) => {
				motion = m;
				const { gsap, ScrollTrigger } = m;
				ctx = gsap.context(() => {
					// "Focus pull": each photo starts soft, desaturated and slightly
					// cropped, then snaps sharp as it scrolls into view.
					const develop = (batch: Element[]) =>
						gsap.to(batch, {
							'--focus': 0,
							clipPath: 'inset(0% 0% 0% 0%)',
							duration: 1.1,
							ease: 'expo.out',
							stagger: 0.08,
							overwrite: true
						});
					watchNewItems = () => {
						const fresh = items().filter((el) => !el.dataset.watched);
						fresh.forEach((el) => (el.dataset.watched = '1'));
						gsap.set(fresh, { '--focus': 1, clipPath: 'inset(6% 6% 6% 6%)' });
						ScrollTrigger.batch(fresh, { onEnter: develop, start: 'top 92%', once: true });
					};
					watchNewItems();
				}, grid);
			});
		}

		return () => {
			ctx?.revert();
			viewer?.destroy();
		};
	});

	// When the filter changes, remember where every photo was before the DOM
	// updates, then let GSAP Flip glide them to their new places.
	$effect.pre(() => {
		void photos;
		if (motion && grid) flipState = motion.Flip.getState(items());
	});
	$effect(() => {
		void photos;
		if (!motion || !flipState) return;
		const state = flipState;
		flipState = undefined;
		motion.Flip.from(state, {
			targets: items(),
			duration: 0.7,
			ease: 'expo.inOut',
			stagger: 0.015,
			absolute: true,
			onEnter: (els) =>
				motion!.gsap.fromTo(
					els,
					{ autoAlpha: 0, scale: 0.94, '--focus': 1 },
					{ autoAlpha: 1, scale: 1, '--focus': 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, delay: 0.25, ease: 'power3.out' }
				)
		});
		items().forEach((el) => (el.dataset.watched = '1'));
		motion.ScrollTrigger.refresh();
	});

	function open(event: MouseEvent, index: number) {
		if (!viewer || event.metaKey || event.ctrlKey || event.shiftKey) return;
		event.preventDefault();
		viewer.open(index);
	}
</script>

<div class="grid" bind:this={grid}>
	{#each photos as photo, i (photo.path)}
		{@const ratio = photo.width / photo.height}
		<a
			class="item"
			data-af
			href={largest(photo)}
			id={photo.slug}
			style:--ratio={ratio}
			style:background-image="url({photo.placeholder})"
			onclick={(e) => open(e, i)}
		>
			<enhanced:img
				src={pictures[photo.path]}
				alt={photo.alt}
				sizes="(max-width: 40rem) 100vw, (max-width: 72rem) 50vw, 33vw"
				loading={i < 3 ? 'eager' : 'lazy'}
				fetchpriority={i === 0 ? 'high' : undefined}
			/>
			<span class="bracket tl"></span>
			<span class="bracket tr"></span>
			<span class="bracket bl"></span>
			<span class="bracket br"></span>
			{#if photo.capture.lens}
				<span class="capture mono">
					{[photo.capture.lens, photo.capture.aperture, photo.capture.shutter, photo.capture.iso && `ISO ${photo.capture.iso}`]
						.filter(Boolean)
						.join(' · ')}
				</span>
			{/if}
		</a>
	{/each}
</div>

<style>
	.grid {
		--row-height: clamp(14rem, 28vw, 26rem);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	/* Keeps the last row from stretching to full width */
	.grid::after {
		content: '';
		flex-grow: 1000;
	}

	.item {
		position: relative;
		flex-grow: calc(var(--ratio) * 100);
		flex-basis: calc(var(--ratio) * var(--row-height));
		aspect-ratio: var(--ratio);
		overflow: hidden;
		background-size: cover;
		outline: none;
	}
	.item {
		--focus: 0;
	}
	.item :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(calc(var(--focus) * 14px)) saturate(calc(1 - var(--focus) * 0.7));
		transform: scale(calc(1 + var(--focus) * 0.06));
		transition: transform var(--duration-base) var(--ease-focus);
	}
	.item:hover :global(img) {
		transform: scale(1.015);
	}

	.bracket {
		position: absolute;
		width: 1.25rem;
		height: 1.25rem;
		border: 0 solid var(--color-accent);
		opacity: 0;
		transition:
			opacity var(--duration-fast) var(--ease-focus),
			transform var(--duration-base) var(--ease-focus);
	}
	.tl { top: 0.75rem; left: 0.75rem; border-top-width: 2px; border-left-width: 2px; transform: translate(-6px, -6px); }
	.tr { top: 0.75rem; right: 0.75rem; border-top-width: 2px; border-right-width: 2px; transform: translate(6px, -6px); }
	.bl { bottom: 0.75rem; left: 0.75rem; border-bottom-width: 2px; border-left-width: 2px; transform: translate(-6px, 6px); }
	.br { bottom: 0.75rem; right: 0.75rem; border-bottom-width: 2px; border-right-width: 2px; transform: translate(6px, 6px); }

	.capture {
		position: absolute;
		left: 2.25rem;
		bottom: 0.85rem;
		color: #fff;
		text-shadow: 0 1px 4px rgb(0 0 0 / 0.6);
		opacity: 0;
		transition: opacity var(--duration-base) var(--ease-focus);
	}

	:global(html:not(.has-af)) .item:hover .bracket,
	.item:focus-visible .bracket {
		opacity: 1;
		transform: none;
	}
	.item:hover .capture,
	.item:focus-visible .capture {
		opacity: 1;
	}

	@media (max-width: 40rem) {
		.item {
			flex-basis: 100%;
		}
	}
</style>
