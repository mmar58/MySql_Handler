import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  server: {
    host: true,
    port: 8155,
    proxy: {
      // Proxy all REST API calls to the Express backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const clientIp = req.socket.remoteAddress ?? '';
            proxyReq.setHeader('X-Forwarded-For', clientIp);
            proxyReq.setHeader('X-Real-IP', clientIp);
          });
        },
      },
      // Proxy socket.io WebSocket traffic
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
      // Proxy other backend routes
      '/store-credentials': {
        target: 'http://localhost:3000',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const clientIp = req.socket.remoteAddress ?? '';
            proxyReq.setHeader('X-Forwarded-For', clientIp);
            proxyReq.setHeader('X-Real-IP', clientIp);
          });
        },
      },
      '/session-credentials': {
        target: 'http://localhost:3000',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const clientIp = req.socket.remoteAddress ?? '';
            proxyReq.setHeader('X-Forwarded-For', clientIp);
            proxyReq.setHeader('X-Real-IP', clientIp);
          });
        },
      },
      '/logout': 'http://localhost:3000',
      '/backups': {
        target: 'http://localhost:3000',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const clientIp = req.socket.remoteAddress ?? '';
            proxyReq.setHeader('X-Forwarded-For', clientIp);
            proxyReq.setHeader('X-Real-IP', clientIp);
          });
        },
      },
    },
  },
});
