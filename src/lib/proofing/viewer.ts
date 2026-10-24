import type PhotoSwipe from 'photoswipe';
import type PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import '#lib/styles/viewer.css';

export interface ProofSlide {
	id: string;
	name: string;
	width: number;
	height: number;
	thumbUrl: string;
}

export interface ProofViewerOptions {
	grid: HTMLElement;
	slides: () => ProofSlide[];
	/** Resolves to an object URL for the full-size proof */
	full: (id: string) => Promise<string>;
	isPicked: (id: string) => boolean;
	/** Picks or unpicks a photo, or explains why it can't */
	toggle: (id: string) => void;
	/** False when the gallery is locked, which hides the pick button */
	canPick: () => boolean;
	/** Live package tally shown in the viewer HUD */
	tally: () => string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const shortName = (name: string) => name.replace(/\.[^.]+$/, '');
const heart =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>';

/**
 * Full-screen proof viewer (PhotoSwipe). Each slide starts on its grid
 * thumbnail and swaps to the full proof once it arrives; the photo on each
 * side is fetched ahead. A bottom thumb-zone button (or P) picks the open photo.
 */
export function proofViewer(options: ProofViewerOptions) {
	const loaded = new Map<string, string>();
	const fetching = new Set<string>();
	let lightbox: PhotoSwipeLightbox | undefined;
	let ready: Promise<PhotoSwipeLightbox> | undefined;
	let refreshHud = () => {};

	const dataSource = () =>
		options.slides().map((slide) => ({
			width: slide.width,
			height: slide.height,
			alt: `Proof ${slide.name}`,
			slide
		}));

	const slideAt = (pswp: PhotoSwipe, index: number) =>
		(pswp.getItemData(index) as { slide?: ProofSlide } | undefined)?.slide;

	function fetchAround(pswp: PhotoSwipe) {
		const total = pswp.getNumItems();
		if (!total) return;
		for (const offset of [0, 1, -1]) {
			const index = (pswp.currIndex + offset + total) % total;
			const slide = slideAt(pswp, index);
			if (!slide || loaded.has(slide.id) || fetching.has(slide.id)) continue;
			fetching.add(slide.id);
			options
				.full(slide.id)
				.then((url) => {
					loaded.set(slide.id, url);
					const active = lightbox?.pswp;
					if (!active || active.isDestroying) return;
					const count = active.getNumItems();
					for (let i = 0; i < count; i++) {
						if (slideAt(active, i)?.id === slide.id) {
							active.refreshSlideContent(i);
							break;
						}
					}
				})
				.catch((error) => console.error(error))
				.finally(() => fetching.delete(slide.id));
		}
	}

	function syncGridScroll(pswp: PhotoSwipe) {
		const slide = slideAt(pswp, pswp.currIndex);
		const el = slide && options.grid.querySelector<HTMLElement>(`[data-pid="${slide.id}"]`);
		el?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
	}

	function init() {
		ready ??= import('photoswipe/lightbox').then(({ default: Lightbox }) => {
			lightbox = new Lightbox({
				pswpModule: () => import('photoswipe'),
				bgOpacity: 1,
				showHideAnimationType: 'fade',
				counter: false,
				zoom: true,
				close: true,
				arrowPrevSVG: '<span class="pswp-arrow" aria-hidden="true">←</span>',
				arrowNextSVG: '<span class="pswp-arrow" aria-hidden="true">→</span>',
				closeSVG: '<span class="pswp-close-x" aria-hidden="true">×</span>'
			});

			lightbox.addFilter('itemData', (data) => {
				const slide = (data as { slide: ProofSlide }).slide;
				return { ...data, src: loaded.get(slide.id) ?? slide.thumbUrl, msrc: slide.thumbUrl };
			});
			lightbox.addFilter('thumbEl', (thumb, data) => {
				const id = (data as { slide?: ProofSlide }).slide?.id;
				return ((id && options.grid.querySelector<HTMLElement>(`[data-pid="${id}"] img`)) || thumb) as HTMLElement;
			});

			lightbox.on('uiRegister', () => {
				const pswp = lightbox!.pswp!;
				pswp.ui!.registerElement({
					name: 'viewfinder',
					order: 9,
					isButton: false,
					appendTo: 'root',
					html: '',
					onInit: (el) => {
						el.className = 'pswp__viewfinder mono';
						el.innerHTML =
							'<div class="pswp__meta">' +
							'<span class="pswp__title"><span class="pswp__frame"></span> · <span class="pswp__name"></span></span>' +
							'<span class="pswp__tally"></span>' +
							'</div>' +
							`<button type="button" class="pswp__pick" title="Pick this photo (P)">${heart}<span class="pswp__pick-label">Pick</span></button>`;

						const frameEl = el.querySelector<HTMLElement>('.pswp__frame')!;
						const nameEl = el.querySelector<HTMLElement>('.pswp__name')!;
						const tallyEl = el.querySelector<HTMLElement>('.pswp__tally')!;
						const pickBtn = el.querySelector<HTMLButtonElement>('.pswp__pick')!;
						const pickLabel = el.querySelector<HTMLElement>('.pswp__pick-label')!;

						const stop = (e: Event) => e.stopPropagation();
						pickBtn.addEventListener('pointerdown', stop);
						pickBtn.addEventListener('touchstart', stop, { passive: true });
						pickBtn.addEventListener('click', (e) => {
							e.stopPropagation();
							const slide = slideAt(pswp, pswp.currIndex);
							if (slide && options.canPick()) options.toggle(slide.id);
							refreshHud();
						});

						refreshHud = () => {
							const slide = pswp.currSlide && slideAt(pswp, pswp.currIndex);
							const picked = !!slide && options.isPicked(slide.id);
							const editable = options.canPick();
							frameEl.textContent = `${pad(pswp.currIndex + 1)} / ${pad(pswp.getNumItems())}`;
							nameEl.textContent = slide ? shortName(slide.name) : '';
							tallyEl.textContent = options.tally();
							pickBtn.hidden = !editable && !picked;
							pickBtn.disabled = !editable;
							pickBtn.classList.toggle('is-picked', picked);
							pickBtn.setAttribute('aria-pressed', String(picked));
							pickLabel.textContent = picked ? 'Picked' : 'Pick';
						};

						pswp.on('change', refreshHud);
						refreshHud();
					}
				});
			});

			lightbox.on('change', () => {
				const pswp = lightbox!.pswp!;
				fetchAround(pswp);
				syncGridScroll(pswp);
			});
			lightbox.on('afterInit', () => fetchAround(lightbox!.pswp!));
			lightbox.on('keydown', (event) => {
				const key = event.originalEvent.key;
				if ((key === 'p' || key === 'P') && options.canPick()) {
					const pswp = lightbox!.pswp!;
					const slide = slideAt(pswp, pswp.currIndex);
					if (slide) options.toggle(slide.id);
					refreshHud();
				}
			});
			lightbox.on('destroy', () => (refreshHud = () => {}));

			lightbox.init();
			return lightbox;
		});
		return ready;
	}

	return {
		open(index: number) {
			init().then((lb) => lb.loadAndOpen(index, dataSource()));
		},
		/** Call after picks change outside the viewer */
		refresh() {
			refreshHud();
		},
		destroy() {
			lightbox?.destroy();
		}
	};
}
