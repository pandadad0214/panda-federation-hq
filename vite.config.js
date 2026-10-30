import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 1500 } });
