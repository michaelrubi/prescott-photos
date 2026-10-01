import type PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import '#lib/styles/viewer.css';
import { pictures, type PhotoMeta } from '#lib/photos.ts';

export interface ViewerHandle {
	open(index: number): void;
	destroy(): void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function captureLine(photo: PhotoMeta) {
	const { lens, aperture, shutter, iso } = photo.capture;
	return [lens, aperture, shutter, iso && `ISO ${iso}`].filter(Boolean).join(' · ');
}

/**
 * Full-screen viewer (PhotoSwipe): swipe and pinch-zoom on phones, arrow keys
 * on desktop, a frame counter and capture data. The open photo is reflected in
 * the URL hash (`#slug`) so every photo has a link that can be shared.
 * PhotoSwipe itself loads only when the viewer first opens.
 */
export function openViewer(gallery: HTMLElement, getPhotos: () => PhotoMeta[]): ViewerHandle {
	let lightbox: PhotoSwipeLightbox | undefined;
	let ready: Promise<PhotoSwipeLightbox> | undefined;

	const dataSource = () =>
		getPhotos().map((photo) => {
			const picture = pictures[photo.path];
			const srcset = picture.sources.avif ?? picture.sources.webp;
			return {
				src: picture.img.src,
				srcset,
				width: picture.img.w,
				height: picture.img.h,
				alt: photo.alt,
				msrc: photo.placeholder,
				photo
			};
		});

	function init() {
		ready ??= import('photoswipe/lightbox').then(({ default: Lightbox }) => {
			lightbox = new Lightbox({
				pswpModule: () => import('photoswipe'),
				bgOpacity: 1,
				showHideAnimationType: 'zoom',
				counter: false,
				zoom: true,
				close: true,
				arrowPrevSVG: '<span class="pswp-arrow" aria-hidden="true">←</span>',
				arrowNextSVG: '<span class="pswp-arrow" aria-hidden="true">→</span>',
				closeSVG: '<span class="pswp-close-x" aria-hidden="true">×</span>'
			});

			lightbox.addFilter('thumbEl', (thumb, data, index) => {
				return gallery.querySelectorAll<HTMLElement>('a img')[index] ?? thumb;
			});
			lightbox.addFilter('placeholderSrc', (src, slide) => slide.data.msrc ?? src);

			lightbox.on('uiRegister', () => {
				lightbox!.pswp!.ui!.registerElement({
					name: 'viewfinder',
					order: 9,
					isButton: false,
					appendTo: 'root',
					html: '',
					onInit: (el, pswp) => {
						el.className = 'pswp__viewfinder mono';
						const update = () => {
							const photo = (pswp.currSlide?.data as { photo?: PhotoMeta })?.photo;
							const total = pswp.getNumItems();
							el.innerHTML = `<span>${photo ? captureLine(photo) : ''}</span><span class="pswp__frame">${pad(pswp.currIndex + 1)} / ${pad(total)}</span>`;
						};
						pswp.on('change', update);
						update();
					}
				});
			});

			lightbox.on('change', () => {
				const photo = (lightbox!.pswp?.currSlide?.data as { photo?: PhotoMeta })?.photo;
				if (photo) history.replaceState(history.state, '', `#${photo.slug}`);
			});
			lightbox.on('close', () => {
				history.replaceState(history.state, '', location.pathname + location.search);
			});

			lightbox.init();
			return lightbox;
		});
		return ready;
	}

	function open(index: number) {
		init().then((lb) => lb.loadAndOpen(index, dataSource()));
	}

	// Open straight to a photo when the page is loaded from a shared link.
	// The index is looked up once PhotoSwipe has loaded, so it matches any
	// filter the page applies on mount.
	const slug = decodeURIComponent(location.hash.slice(1));
	if (slug) {
		init().then((lb) => {
			const items = dataSource();
			const index = items.findIndex((item) => item.photo.slug === slug);
			if (index !== -1) lb.loadAndOpen(index, items);
		});
	}

	return {
		open,
		destroy() {
			lightbox?.destroy();
		}
	};
}
