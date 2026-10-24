import { listedPosts } from '#lib/server/posts.ts';
import { site } from '#lib/site.ts';

export const prerender = true;

const pages = ['/', '/portraits', '/work', '/sessions', '/about', '/book', '/terms', '/privacy'];

export async function GET() {
	const posts = await listedPosts();
	const urls = [
		...pages.map((path) => `\t<url><loc>${site.url}${path === '/' ? '' : path}</loc></url>`),
		...(posts.length ? [`\t<url><loc>${site.url}/blog</loc><lastmod>${posts[0].updated ?? posts[0].date}</lastmod></url>`] : []),
		...posts.map(
			(p) => `\t<url><loc>${site.url}/blog/${p.slug}</loc><lastmod>${p.updated ?? p.date}</lastmod></url>`
		)
	].join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
