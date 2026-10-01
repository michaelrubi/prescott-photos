import { enhancedImages } from '@sveltejs/enhanced-img';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Firebase Hosting serves the web app config at this reserved path. Locally,
// fetch it from the deployed site so proofing galleries work in `pnpm dev`.
const firebaseInit = {
	'/__/firebase': { target: 'https://rubi-photo.web.app', changeOrigin: true }
};

export default defineConfig({
	plugins: [
		enhancedImages(),
		sveltekit({
			adapter: adapter({ strict: true })
		})
	],
	server: { proxy: firebaseInit },
	preview: { proxy: firebaseInit }
});
