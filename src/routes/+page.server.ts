import { loadPhotos } from '#lib/server/photos.ts';
import { shareImages } from '#lib/photos.ts';

export async function load() {
	const photos = await loadPhotos();
	const portraits = photos.filter((p) => p.category === 'portraits');
	const hero = photos.find((p) => p.hero) ?? portraits[0] ?? photos[0];
	const rest = portraits.filter((p) => p !== hero);
	// One photo beside each "how it feels" point, picked from across the reel
	const feel = [1, 3, 5].map((i) => rest[i % rest.length] ?? hero);
	return { hero, reel: rest.slice(0, 8), feel, heroShare: shareImages[hero.path] };
}
