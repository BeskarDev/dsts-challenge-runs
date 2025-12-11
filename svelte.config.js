import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/dsts-challenge-runs' : ''
		},
		alias: {
			$data: 'src/data'
		},
		prerender: {
			entries: ['*', '/challenge/random-evolution']
		}
	}
};

export default config;
