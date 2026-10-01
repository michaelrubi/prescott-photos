import { loadPhotos } from '#lib/server/photos.ts';

export async function load() {
	const photos = await loadPhotos();
	return { photos: photos.filter((p) => p.category === 'portraits').slice(0, 20) };
}
