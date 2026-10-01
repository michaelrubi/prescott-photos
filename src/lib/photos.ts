import type { Picture } from '@sveltejs/enhanced-img';

export const categories = [
	{ id: 'portraits', label: 'Portraits' },
	{ id: 'couples', label: 'Couples' },
	{ id: 'families', label: 'Families' }
] as const;

export type Category = (typeof categories)[number]['id'];

export interface Capture {
	lens?: string;
	aperture?: string;
	shutter?: string;
	iso?: number;
}

/** Everything about a photo except its image files, built at prerender time. */
export interface PhotoMeta {
	/** Path relative to the project root, e.g. `/photos/portraits/watson-lake.jpg` */
	path: string;
	slug: string;
	category: Category;
	alt: string;
	width: number;
	height: number;
	capture: Capture;
	/** Tiny blurred preview (ThumbHash rendered to a PNG data URL) */
	placeholder: string;
}

/**
 * Every photo, resized to several widths in AVIF and WebP at build time.
 * `@sveltejs/enhanced-img` strips metadata (including GPS) from the output.
 */
export const pictures = import.meta.glob<Picture>('/photos/*/*.{jpg,jpeg,JPG,JPEG}', {
	eager: true,
	import: 'default',
	query: { enhanced: true, w: '2560;1920;1280;960;640' }
});

/** 1200×630 JPG crops of every photo, for social share cards. */
export const shareImages = import.meta.glob<string>('/photos/*/*.{jpg,jpeg,JPG,JPEG}', {
	eager: true,
	import: 'default',
	query: { w: '1200', h: '630', fit: 'cover', format: 'jpg', quality: '80' }
});
