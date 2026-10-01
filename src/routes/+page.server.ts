import { loadPhotos } from '#lib/server/photos.ts';
import { shareImages } from '#lib/photos.ts';

export async function load() {
	const photos = await loadPhotos();
	const portraits = photos.filter((p) => p.category === 'portraits');
	const hero = portraits[0] ?? photos[0];
	// One photo beside each "how it feels" point, picked from across the reel
	const feel = [2, 4, 6].map((i) => portraits[i % portraits.length] ?? hero);
	return { hero, reel: portraits.slice(1, 9), feel, heroShare: shareImages[hero.path] };
}
