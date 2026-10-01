import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash';
import { categories, type Capture, type PhotoMeta } from '#lib/photos.ts';

const root = join(process.cwd(), 'photos');
const image = /\.jpe?g$/i;

interface SidecarEntry {
	alt?: string;
	/** Use this photo as the home page hero and default share image */
	hero?: boolean;
	/** CSS object-position for crops, e.g. "60% 40%" to keep the subject in frame */
	focus?: string;
}

function formatShutter(seconds: number) {
	return seconds >= 1 ? `${seconds}s` : `1/${Math.round(1 / seconds)}`;
}

async function readCapture(file: string): Promise<Capture> {
	const exif = await exifr
		.parse(readFileSync(file), { pick: ['FNumber', 'ExposureTime', 'ISO', 'FocalLength'] })
		.catch(() => undefined);
	if (!exif) return {};
	return {
		lens: exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : undefined,
		aperture: exif.FNumber ? `f/${exif.FNumber.toFixed(1)}` : undefined,
		shutter: exif.ExposureTime ? formatShutter(exif.ExposureTime) : undefined,
		iso: exif.ISO
	};
}

async function placeholder(file: string) {
	const { data, info } = await sharp(file)
		.resize(100, 100, { fit: 'inside' })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	return thumbHashToDataURL(rgbaToThumbHash(info.width, info.height, data));
}

let cache: Promise<PhotoMeta[]> | undefined;

/** Reads every photo under `photos/<category>/`, with alt text from `photos.json`. */
export function loadPhotos(): Promise<PhotoMeta[]> {
	cache ??= (async () => {
		const photos: PhotoMeta[] = [];
		for (const { id: category } of categories) {
			const dir = join(root, category);
			if (!existsSync(dir)) continue;
			const sidecarPath = join(dir, 'photos.json');
			const sidecar: Record<string, SidecarEntry> = existsSync(sidecarPath)
				? JSON.parse(readFileSync(sidecarPath, 'utf8'))
				: {};
			// Photos appear in the order they're listed in photos.json, then any
			// unlisted files by name
			const listed = Object.keys(sidecar);
			const rank = (f: string) => (listed.includes(f) ? listed.indexOf(f) : listed.length);
			const files = readdirSync(dir)
				.filter((f: string) => image.test(f))
				.sort((a: string, b: string) => rank(a) - rank(b) || a.localeCompare(b));
			for (const name of files) {
				const file = join(dir, name);
				const { width = 0, height = 0, orientation } = await sharp(file).metadata();
				const rotated = orientation !== undefined && orientation >= 5;
				photos.push({
					path: `/photos/${category}/${name}`,
					slug: name.replace(image, ''),
					category,
					alt: sidecar[name]?.alt ?? '',
					hero: sidecar[name]?.hero,
					focus: sidecar[name]?.focus,
					width: rotated ? height : width,
					height: rotated ? width : height,
					capture: await readCapture(file),
					placeholder: await placeholder(file)
				});
			}
		}
		return photos;
	})();
	return cache;
}
