import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// mode "single" — один самодостаточный index.html (для публикации по ссылке).
// base — подпапка при хостинге на GitHub Pages и т.п. (env HAK_BASE, по умолчанию относительный).
export default defineConfig(({ mode }) => ({
  base: process.env.HAK_BASE ?? './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    target: 'es2020',
  },
}));
