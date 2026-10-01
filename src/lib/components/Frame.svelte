<!--
	A photo in the "viewfinder" frame: corner focus brackets on hover/focus,
	capture data and a frame counter in mono type. Until real photos are
	wired up, `tone` paints a placeholder gradient instead of an image.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	export interface Exif {
		lens: string;
		aperture: string;
		shutter: string;
		iso: number;
	}

	let {
		ratio = '4 / 5',
		exif,
		frame,
		total,
		label,
		tone = 'amber',
		children
	}: {
		ratio?: string;
		exif?: Exif;
		frame?: number;
		total?: number;
		label: string;
		tone?: 'amber' | 'dusk' | 'granite' | 'pine';
		children?: Snippet;
	} = $props();

	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<figure class="frame" style:--ratio={ratio}>
	<div class="image tone-{tone}" role="img" aria-label={label}>
		{#if children}{@render children()}{/if}
		<span class="bracket tl"></span>
		<span class="bracket tr"></span>
		<span class="bracket bl"></span>
		<span class="bracket br"></span>
	</div>
	{#if exif || frame}
		<figcaption class="mono">
			{#if exif}
				<span>{exif.lens} · {exif.aperture} · {exif.shutter} · ISO {exif.iso}</span>
			{/if}
			{#if frame && total}
				<span class="counter">{pad(frame)} / {pad(total)}</span>
			{/if}
		</figcaption>
	{/if}
</figure>

<style>
	.frame {
		margin: 0;
		display: grid;
		gap: var(--space-2);
	}

	.image {
		position: relative;
		aspect-ratio: var(--ratio);
		overflow: hidden;
		background: var(--color-surface);
		outline: none;
	}

	/* Placeholder art until real photos arrive */
	.tone-amber {
		background:
			radial-gradient(ellipse 40% 55% at 50% 58%, rgb(30 18 10 / 0.85), transparent 70%),
			radial-gradient(circle at 70% 20%, #f6c27f, transparent 55%),
			linear-gradient(160deg, #e9a15c, #6b3a22 70%, #1d120c);
	}
	.tone-dusk {
		background:
			radial-gradient(ellipse 38% 52% at 45% 60%, rgb(12 12 24 / 0.85), transparent 70%),
			radial-gradient(circle at 20% 15%, #c88aa0, transparent 50%),
			linear-gradient(170deg, #5d5f8f, #2b2540 65%, #0e0d16);
	}
	.tone-granite {
		background:
			radial-gradient(ellipse 36% 50% at 55% 60%, rgb(15 15 15 / 0.85), transparent 70%),
			radial-gradient(circle at 80% 10%, #d8d2c8, transparent 45%),
			linear-gradient(150deg, #9b948a, #4a4640 60%, #151413);
	}
	.tone-pine {
		background:
			radial-gradient(ellipse 40% 52% at 48% 62%, rgb(8 16 12 / 0.85), transparent 70%),
			radial-gradient(circle at 25% 20%, #c9d3a0, transparent 45%),
			linear-gradient(165deg, #5f7a55, #26372a 65%, #0c130e);
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

	.image:hover .bracket,
	.image:focus-visible .bracket {
		opacity: 1;
		transform: none;
	}

	figcaption {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-3);
		opacity: 0.7;
		transition: opacity var(--duration-base) var(--ease-focus);
	}
	.frame:hover figcaption,
	.frame:focus-within figcaption {
		opacity: 1;
	}
	.counter {
		margin-left: auto;
		white-space: nowrap;
		color: var(--color-text);
	}
</style>
