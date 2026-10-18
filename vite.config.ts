import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages serves the site under /Simon/ (case-sensitive)
  base: '/Simon/',
  test: {
    environment: 'node',
  },
});
