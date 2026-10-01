import { site } from '#lib/site.ts';

export const prerender = true;

const pages = ['/', '/portraits', '/work', '/sessions', '/about', '/book', '/terms', '/privacy'];

export function GET() {
	const urls = pages
		.map((path) => `\t<url><loc>${site.url}${path === '/' ? '' : path}</loc></url>`)
		.join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
