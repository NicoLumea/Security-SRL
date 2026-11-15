import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  // The Worker permits same-origin script files, not inline JavaScript.
  vite: { build: { assetsInlineLimit: 0 }, server: { allowedHosts: ['terminal.local'] } },
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'never' },
});
