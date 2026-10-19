import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://java-vara.github.io',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
