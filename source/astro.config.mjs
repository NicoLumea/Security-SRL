import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  vite: { server: { allowedHosts: ['terminal.local'] } },
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' },
});
