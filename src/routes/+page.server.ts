import { loadPhotos } from '#lib/server/photos.ts';

export async function load() {
	const photos = await loadPhotos();
	const portraits = photos.filter((p) => p.category === 'portraits');
	return { hero: portraits[0] ?? photos[0], reel: portraits.slice(1, 9) };
}
