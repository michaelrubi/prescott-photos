import type { Attachment } from 'svelte/attachments';
import { loadMotion, reducedMotion } from './gsap.ts';

/**
 * Fades and lifts the element's direct children into view as it scrolls in,
 * like a lens settling into focus. Does nothing for reduced-motion visitors.
 */
export function reveal(options: { stagger?: number; y?: number } = {}): Attachment<HTMLElement> {
	return (node) => {
		if (reducedMotion()) return;

		let cleanup = () => {};
		let cancelled = false;

		loadMotion().then(({ gsap }) => {
			if (cancelled) return;
			const ctx = gsap.context(() => {
				gsap.from(node.children, {
					autoAlpha: 0,
					y: options.y ?? 24,
					filter: 'blur(6px)',
					duration: 0.7,
					ease: 'power3.out',
					stagger: options.stagger ?? 0.06,
					scrollTrigger: { trigger: node, start: 'top 85%', once: true }
				});
			}, node);
			cleanup = () => ctx.revert();
		});

		return () => {
			cancelled = true;
			cleanup();
		};
	};
}
