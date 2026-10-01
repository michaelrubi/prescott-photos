// Generates placeholder photos so the gallery can be built and tested
// before real exports arrive. Delete photos/*/sample-*.jpg once real
// photos are in place.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const palettes = {
	portraits: [['#e9a15c', '#6b3a22', '#1d120c'], ['#9b948a', '#4a4640', '#151413'], ['#c88aa0', '#2b2540', '#0e0d16']],
	couples: [['#f6c27f', '#8a4b2a', '#20130c'], ['#c9d3a0', '#26372a', '#0c130e']],
	families: [['#e8c9a0', '#7a5a3a', '#1c140c'], ['#a8c0d8', '#3a4a5c', '#10141a']]
};
const shapes = [[2, 3], [4, 5], [3, 2], [2, 3], [4, 5], [3, 2]];
const lenses = [['85', '18/10', '1/500', 100], ['50', '2/1', '1/250', 200], ['135', '2/1', '1/640', 100], ['35', '14/10', '1/125', 800]];

let n = 0;
for (const [category, tones] of Object.entries(palettes)) {
	const dir = `photos/${category}`;
	mkdirSync(dir, { recursive: true });
	const meta = {};
	const count = category === 'portraits' ? 8 : 5;
	for (let i = 1; i <= count; i++) {
		const [a, b, c] = tones[i % tones.length];
		const [rw, rh] = shapes[(i + n) % shapes.length];
		const w = rw > rh ? 2400 : Math.round((2400 * rw) / rh);
		const h = rw > rh ? Math.round((2400 * rh) / rw) : 2400;
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
			<defs>
				<linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="0.65" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
				<radialGradient id="s" cx="0.5" cy="0.6" r="0.4"><stop offset="0" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
			</defs>
			<rect width="100%" height="100%" fill="url(#g)"/>
			<ellipse cx="${w / 2}" cy="${h * 0.62}" rx="${w * 0.22}" ry="${h * 0.32}" fill="url(#s)"/>
			<text x="${w * 0.05}" y="${h * 0.93}" font-family="monospace" font-size="${Math.round(w / 30)}" fill="#ffffff" fill-opacity="0.5">SAMPLE ${category.toUpperCase()} ${String(i).padStart(2, '0')}</text>
		</svg>`;
		const [focal, fnum, shutter, iso] = lenses[(i + n) % lenses.length];
		const file = `sample-${category}-${String(i).padStart(2, '0')}.jpg`;
		await sharp(Buffer.from(svg))
			.jpeg({ quality: 82 })
			.withExif({
				IFD0: { Make: 'Sony', Model: 'ILCE-7M4' },
				IFD2: { FNumber: fnum, ExposureTime: shutter, ISOSpeedRatings: String(iso), FocalLength: `${focal}/1`, LensModel: `FE ${focal}mm` }
			})
			.toFile(`${dir}/${file}`);
		meta[file] = { alt: `Sample ${category} photo ${i}, placeholder until real images are added` };
	}
	writeFileSync(`${dir}/photos.json`, JSON.stringify(meta, null, '\t') + '\n');
	n++;
}
console.log('done');
