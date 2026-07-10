import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
// Force both app code and @testing-library to use the same single React instance
// (root node_modules) so hooks work across the monorepo boundary.
const rootNodeModules = path.resolve(__dirname, '../../node_modules');

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.join(rootNodeModules, 'react'),
      'react-dom': path.join(rootNodeModules, 'react-dom'),
      'react/jsx-runtime': path.join(rootNodeModules, 'react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(rootNodeModules, 'react/jsx-dev-runtime.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['app/**/*.spec.ts', 'app/**/*.spec.tsx'],
  },
});
