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
			const files = readdirSync(dir)
				.filter((f: string) => image.test(f))
				.sort();
			for (const name of files) {
				const file = join(dir, name);
				const { width = 0, height = 0, orientation } = await sharp(file).metadata();
				const rotated = orientation !== undefined && orientation >= 5;
				photos.push({
					path: `/photos/${category}/${name}`,
					slug: name.replace(image, ''),
					category,
					alt: sidecar[name]?.alt ?? '',
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
