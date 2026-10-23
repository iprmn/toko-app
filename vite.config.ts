import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { createApiApp } from './server/api';

function sqliteApiPlugin(): Plugin {
  return {
    name: 'sqlite-api-plugin',
    configureServer(server) {
      const apiApp = createApiApp();
      server.middlewares.use('/api', apiApp);
    },
    configurePreviewServer(server) {
      const apiApp = createApiApp();
      server.middlewares.use('/api', apiApp);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), sqliteApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: ['**/database/**', '**/*.db', '**/*.db-wal', '**/*.db-shm'],
            },
    },
  };
});
