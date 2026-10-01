import { loadPhotos } from '#lib/server/photos.ts';

export async function load() {
	return { photos: await loadPhotos() };
}
