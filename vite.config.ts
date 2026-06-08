import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { URL } from 'node:url';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(packageJson.version ?? '0.0.0')
	},
	// server: {
	// 	proxy: {
	// 		'/api': {
	// 			target: 'http://localhost:8787',
	// 			changeOrigin: true
	// 		}
	// 	}
	// },
	plugins: [tailwindcss(), sveltekit()]
});
