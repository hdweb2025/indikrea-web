import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { expressApp } from './server/express-app';

// Middleware to use Express app within Vite's dev server
const expressMiddleware = () => ({
  name: 'express-middleware',
  configureServer(server) {
    server.middlewares.use(expressApp);
  }
});

export default defineConfig({
  plugins: [react(), expressMiddleware()],
});
