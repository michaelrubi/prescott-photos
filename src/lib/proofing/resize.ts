/**
 * Turns an exported photo into the two JPEGs a proofing gallery stores: a
 * full proof and a grid thumbnail. Runs in the browser on upload. Re-encoding
 * also drops all metadata, including GPS.
 */

/** Firestore documents max out at 1 MiB, so proofs stay comfortably under it */
const FULL = { edge: 1600, quality: 0.85, maxBytes: 900_000 };
const THUMB = { edge: 640, quality: 0.75, maxBytes: 120_000 };

export interface Prepared {
	width: number;
	height: number;
	full: Uint8Array;
	thumb: Uint8Array;
}

async function encode(source: ImageBitmap, spec: typeof FULL) {
	const scale = Math.min(1, spec.edge / Math.max(source.width, source.height));
	const width = Math.round(source.width * scale);
	const height = Math.round(source.height * scale);
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d')!;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(source, 0, 0, width, height);

	let quality = spec.quality;
	let blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
	while (blob.size > spec.maxBytes && quality > 0.5) {
		quality -= 0.08;
		blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
	}
	return { width, height, bytes: new Uint8Array(await blob.arrayBuffer()) };
}

export async function prepare(file: File): Promise<Prepared> {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	try {
		const full = await encode(bitmap, FULL);
		const thumb = await encode(bitmap, THUMB);
		return { width: full.width, height: full.height, full: full.bytes, thumb: thumb.bytes };
	} finally {
		bitmap.close();
	}
}
