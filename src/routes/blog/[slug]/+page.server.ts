import { error } from '@sveltejs/kit';
import { shareImages } from '#lib/photos.ts';
import { listedPosts, loadPosts } from '#lib/server/posts.ts';

// Drafts are prerendered too, so a preview link can be shared before publishing
export async function entries() {
	return (await loadPosts()).map(({ slug }) => ({ slug }));
}

export async function load({ params }) {
	const posts = await loadPosts();
	const post = posts.find((p) => p.slug === params.slug);
	if (!post) error(404, 'Post not found');
	const listed = await listedPosts();
	const more = listed.filter((p) => p.slug !== post.slug).slice(0, 2);
	return { post, more, shareImage: post.cover ? shareImages[post.cover] : undefined };
}
