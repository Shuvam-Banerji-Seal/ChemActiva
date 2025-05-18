// ChemActiva/chemactiva-website/vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path' // Import resolve from 'path'

export default defineConfig({
  base: '/ChemActiva/', 
  plugins: [
    // ...
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        blog: resolve(__dirname, 'blog.html'),
        research: resolve(__dirname, 'research.html'),
        singleArticle: resolve(__dirname, 'single-article.html'),
        // Add any other HTML pages you have at the root of chemactiva-website
      }
    }
  }
})
