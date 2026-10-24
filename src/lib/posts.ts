/** Everything about a blog post except its body, built at prerender time. */
export interface PostMeta {
	slug: string;
	title: string;
	description: string;
	/** ISO date, e.g. `2026-10-19` */
	date: string;
	/** ISO date of the last meaningful edit, if any */
	updated?: string;
	/** Hidden from the blog list and sitemap, and noindexed, in production builds */
	draft: boolean;
	/** Path relative to the project root, e.g. `/photos/portraits/MJR00444.jpg` */
	cover?: string;
	coverAlt: string;
	minutes: number;
}

/** A post body: Markdown rendered to HTML, with photos split out so they go through the image pipeline. */
export type Segment =
	| { type: 'html'; html: string }
	| { type: 'photo'; path: string; alt: string; caption?: string };

export function formatDate(iso: string) {
	return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
