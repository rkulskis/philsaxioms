import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  // Use GitHub Pages base path only for production builds, not for static serving
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  const base = command === 'build' && isGitHubPages ? '/philsaxioms/' : '/';
  
  return {
  plugins: [react()],
  base,
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  };
});