import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona em qualquer subpasta (ex.: GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './',
});
