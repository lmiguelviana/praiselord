import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: { overlay: true }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      'date-fns',
      'date-fns/locale',
      'react-router-dom',
      '@tanstack/react-query'
    ],
    exclude: [
      '@prisma/client',
      '@mapbox/node-pre-gyp',
      'mock-aws-s3',
      'aws-sdk',
      'nock'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/date-fns/, /node_modules/],
      ignore: [
        '@prisma/client',
        '@mapbox/node-pre-gyp',
        'mock-aws-s3',
        'aws-sdk',
        'nock'
      ]
    }
  }
});
