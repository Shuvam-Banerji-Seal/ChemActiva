// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // No special config needed for this setup yet,
  // but this ensures it exports an object.
  // If your index.html is in the project root and main.js is in src/js/main.js
  // Vite handles this by default.
  // If index.html were in src/, you'd add: root: 'src',
  // build: { outDir: '../dist' }
});