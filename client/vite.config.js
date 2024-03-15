import path from 'path';
import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vite';

const apiRoute = process.env.API_URL;

console.log(path.resolve(__dirname, './src'));

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {
      NODE_ENV: `${process.env.NODE_ENV}`,
      VUE_APP_API_URL: `${apiRoute || `http://localhost:${process.env.BACKEND_HOST_PORT || 3000}`}`,
    },
  },
});
