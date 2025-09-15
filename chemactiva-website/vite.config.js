// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Serve HTML from src/pages and use public for static assets
  root: 'src/pages',
  // serve static assets from project-level public directory (relative from src/pages)
  publicDir: '../../public',
  // map module imports for js and css to src/pages directories
  resolve: {
    alias: {
      '/js': resolve(__dirname, 'src/pages/js'),
      '/css': resolve(__dirname, 'src/pages/css')
    }
  },
  // Point build inputs to our pages and output to project dist
  build: {
    target: 'esnext',
    outDir: '../../dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/pages/index.html'),
        blog: resolve(__dirname, 'src/pages/blog.html'),
        products: resolve(__dirname, 'src/pages/products.html'),
        'products-modern': resolve(__dirname, 'src/pages/products-modern.html'),
        'single-article': resolve(__dirname, 'src/pages/single-article.html'),
        innovation: resolve(__dirname, 'src/pages/innovation.html'),
        offline: resolve(__dirname, 'src/pages/offline.html')
      },
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
        manualChunks: {
          'vendor': ['three', 'gsap'],
          'core': [resolve(__dirname, 'src/pages/js/App.js'), resolve(__dirname, 'src/pages/js/HeroLoader.js')],
          'features': [
            resolve(__dirname, 'src/pages/js/ProductManager.js'), 
            resolve(__dirname, 'src/pages/js/TeamManager.js'),
            resolve(__dirname, 'src/pages/js/ArticleManager.js')
          ],
          'utils': [
            resolve(__dirname, 'src/pages/js/UIAnimations.js'),
            resolve(__dirname, 'src/pages/js/ModernThemeManager.js')
          ]
        }
      }
    }
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
});