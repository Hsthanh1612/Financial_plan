import { defineConfig } from 'vite';

// GitHub Pages phục vụ dưới /<tên-repo>/; đặt VITE_BASE khi build trong CI.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  build: { outDir: 'dist', sourcemap: false },
});
