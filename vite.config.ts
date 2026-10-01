import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ strict: true }),
			prerender: {
				// Pages from the plan that aren't built yet are linked from the
				// header; warn instead of failing until they exist.
				handleHttpError: ({ status, path, referrer, message }) => {
					if (status === 404) {
						console.warn(`404 ${path} (linked from ${referrer})`);
						return;
					}
					throw new Error(message);
				}
			}
		})
	]
});
