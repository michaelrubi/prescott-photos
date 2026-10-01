import { loadPhotos } from '#lib/server/photos.ts';
import { shareImages } from '#lib/photos.ts';

export async function load() {
	const photos = await loadPhotos();
	const cover = photos.find((p) => p.hero) ?? photos.find((p) => p.category === 'portraits') ?? photos[0];
	// Default social card image for pages that don't pick their own
	return { shareImage: cover ? shareImages[cover.path] : undefined };
}
