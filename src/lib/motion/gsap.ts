import type { gsap as GSAP } from 'gsap';
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger';
import type { Flip as FlipPlugin } from 'gsap/Flip';

export interface Motion {
	gsap: typeof GSAP;
	ScrollTrigger: typeof ST;
	Flip: typeof FlipPlugin;
}

let loading: Promise<Motion> | undefined;

/** Loads GSAP and its plugins once, after first paint, and registers them. */
export function loadMotion(): Promise<Motion> {
	loading ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('gsap/Flip')]).then(
		([{ gsap }, { ScrollTrigger }, { Flip }]) => {
			gsap.registerPlugin(ScrollTrigger, Flip);
			return { gsap, ScrollTrigger, Flip };
		}
	);
	return loading;
}

export function reducedMotion() {
	return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A mouse or trackpad, where hover effects make sense. */
export function finePointer() {
	return matchMedia('(hover: hover) and (pointer: fine)').matches;
}
