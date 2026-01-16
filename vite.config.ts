import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  // Use relative paths for GitHub Pages compatibility
  base: './',
  publicDir: 'assets',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable source maps for debugging (can be disabled for smaller builds)
    sourcemap: true,
    // Use esbuild for fast minification
    minify: 'esbuild',
    // Target modern browsers for smaller bundle size
    target: 'es2020',
    // Chunk size warning limit (in KB)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Organize output files
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Organize assets by type
          const info = assetInfo.name || '';
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(info)) {
            return 'images/[name].[hash][extname]';
          }
          if (/\.(mp3|wav|ogg)$/i.test(info)) {
            return 'sounds/[name].[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(info)) {
            return 'fonts/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Keep all game code in one chunk for simplicity
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    // Hot module replacement
    hmr: true
  },
  preview: {
    port: 4173,
    open: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: []
  },
  // Enable esbuild optimizations
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Keep function names for better debugging
    keepNames: true
  }
});
