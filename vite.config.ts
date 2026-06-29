import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : './';

export default defineConfig({
  base,
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'node',
  },
});
