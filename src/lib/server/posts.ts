import { dev } from '$app/env';
import { marked, type Token, type TokensList } from 'marked';
import { pictures } from '#lib/photos.ts';
import type { PostMeta, Segment } from '#lib/posts.ts';
import { loadPhotos } from './photos.ts';

/** Every `posts/<slug>/index.md`, read at build time. */
const sources = import.meta.glob<string>('/posts/*/index.md', { eager: true, import: 'default', query: '?raw' });

export interface Post extends PostMeta {
	body: Segment[];
}

/** Parses the `key: value` front matter between the opening `---` lines. */
function frontMatter(file: string, source: string) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
	if (!match) throw new Error(`${file} needs front matter (title, description, date)`);
	const fields: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const pair = /^(\w+):\s*(.*)$/.exec(line);
		if (pair) fields[pair[1]] = pair[2].trim().replace(/^(['"])(.*)\1$/, '$2');
	}
	return { fields, body: source.slice(match[0].length) };
}

/**
 * Photos are written as `![alt](file.jpg "caption")`. A bare file name means
 * the post's own folder; a path starting `/photos/` is a portfolio photo.
 */
function resolvePhoto(slug: string, src: string) {
	const path = src.startsWith('/') ? src : `/posts/${slug}/${src}`;
	if (!pictures[path]) throw new Error(`posts/${slug}/index.md: no photo at ${path}`);
	return path;
}

function render(slug: string, markdown: string): Segment[] {
	const tokens = marked.lexer(markdown);
	const segments: Segment[] = [];
	let pending: Token[] = [];

	const flush = () => {
		if (!pending.length) return;
		const group = Object.assign(pending, { links: tokens.links }) as TokensList;
		segments.push({ type: 'html', html: marked.parser(group) });
		pending = [];
	};

	for (const token of tokens) {
		// A paragraph holding nothing but one image becomes a full-width photo
		const parts = token.type === 'paragraph' ? token.tokens!.filter((t) => t.raw.trim()) : [];
		const image = parts.length === 1 && parts[0].type === 'image' ? parts[0] : undefined;
		if (image) {
			flush();
			segments.push({
				type: 'photo',
				path: resolvePhoto(slug, image.href),
				alt: image.text,
				caption: image.title ?? undefined
			});
		} else {
			pending.push(token);
		}
	}
	flush();
	return segments;
}

let cache: Promise<Post[]> | undefined;

/** Every post, newest first. Drafts are included; callers decide where they show. */
export function loadPosts(): Promise<Post[]> {
	cache ??= (async () => {
		const photos = await loadPhotos();
		const posts = Object.entries(sources).map(([file, source]) => {
			const slug = file.split('/').at(-2)!;
			const { fields, body } = frontMatter(file, source);
			for (const key of ['title', 'description', 'date']) {
				if (!fields[key]) throw new Error(`${file} is missing "${key}" in its front matter`);
			}
			const cover = fields.cover ? resolvePhoto(slug, fields.cover) : undefined;
			return {
				slug,
				title: fields.title,
				description: fields.description,
				date: fields.date,
				updated: fields.updated || undefined,
				draft: fields.draft === 'true',
				cover,
				coverAlt: fields.coverAlt ?? photos.find((p) => p.path === cover)?.alt ?? '',
				minutes: Math.max(1, Math.round(body.split(/\s+/).length / 220)),
				body: render(slug, body)
			} satisfies Post;
		});
		return posts.sort((a, b) => b.date.localeCompare(a.date));
	})();
	return cache;
}

/** Posts shown in the blog list and sitemap: everything in dev, published posts in a build. */
export async function listedPosts(): Promise<PostMeta[]> {
	const posts = await loadPosts();
	return posts.filter((p) => dev || !p.draft).map(({ body: _, ...meta }) => meta);
}
