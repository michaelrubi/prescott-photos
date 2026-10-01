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
}

const pad = (n: number) => String(n).padStart(2, '0');
const heart =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>';

/**
 * Full-screen proof viewer (PhotoSwipe). Each slide starts on its grid
 * thumbnail and swaps to the full proof once it arrives; the photo on each
 * side is fetched ahead. A heart button (or the P key) picks the open photo.
 */
export function proofViewer(options: ProofViewerOptions) {
	const loaded = new Map<string, string>();
	let lightbox: PhotoSwipeLightbox | undefined;
	let ready: Promise<PhotoSwipeLightbox> | undefined;
	let refreshPick = () => {};

	const dataSource = () =>
		options.slides().map((slide) => ({
			width: slide.width,
			height: slide.height,
			alt: `Proof ${slide.name}`,
			slide
		}));

	const slideAt = (pswp: PhotoSwipe, index: number) =>
		(pswp.getItemData(index) as { slide?: ProofSlide }).slide;

	function fetchAround(pswp: PhotoSwipe) {
		const total = pswp.getNumItems();
		for (const offset of [0, 1, -1]) {
			const index = (pswp.currIndex + offset + total) % total;
			const slide = slideAt(pswp, index);
			if (!slide || loaded.has(slide.id)) continue;
			options
				.full(slide.id)
				.then((url) => {
					if (loaded.has(slide.id)) return;
					loaded.set(slide.id, url);
					if (lightbox?.pswp === pswp && !pswp.isDestroying) pswp.refreshSlideContent(index);
				})
				.catch((error) => console.error(error));
		}
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
					name: 'pick',
					order: 9,
					isButton: true,
					title: 'Pick this photo (P)',
					html: heart,
					onInit: (el) => {
						el.classList.add('pswp__button--pick');
						refreshPick = () => {
							const slide = pswp.currSlide && slideAt(pswp, pswp.currIndex);
							const picked = !!slide && options.isPicked(slide.id);
							el.hidden = !options.canPick();
							el.classList.toggle('is-picked', picked);
							el.setAttribute('aria-pressed', String(picked));
						};
						pswp.on('change', refreshPick);
						refreshPick();
					},
					onClick: () => {
						const slide = slideAt(pswp, pswp.currIndex);
						if (slide && options.canPick()) options.toggle(slide.id);
						refreshPick();
					}
				});
				pswp.ui!.registerElement({
					name: 'viewfinder',
					order: 9,
					isButton: false,
					appendTo: 'root',
					html: '',
					onInit: (el) => {
						el.className = 'pswp__viewfinder mono';
						const update = () => {
							const slide = slideAt(pswp, pswp.currIndex);
							el.innerHTML = `<span></span><span class="pswp__frame">${pad(pswp.currIndex + 1)} / ${pad(pswp.getNumItems())}</span>`;
							el.firstElementChild!.textContent = slide?.name ?? '';
						};
						pswp.on('change', update);
						update();
					}
				});
			});

			lightbox.on('change', () => fetchAround(lightbox!.pswp!));
			lightbox.on('afterInit', () => fetchAround(lightbox!.pswp!));
			lightbox.on('keydown', (event) => {
				const key = event.originalEvent.key;
				if ((key === 'p' || key === 'P') && options.canPick()) {
					const pswp = lightbox!.pswp!;
					const slide = slideAt(pswp, pswp.currIndex);
					if (slide) options.toggle(slide.id);
					refreshPick();
				}
			});
			lightbox.on('destroy', () => (refreshPick = () => {}));

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
			refreshPick();
		},
		destroy() {
			lightbox?.destroy();
		}
	};
}
