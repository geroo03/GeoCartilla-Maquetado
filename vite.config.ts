import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command, isPreview}) => {
  return {
    // GitHub Pages sirve el sitio bajo /<nombre-del-repo>/, asi que el build
    // necesita ese prefijo o los assets dan 404. `npm run preview` tambien lo
    // usa, para que sea un ensayo fiel de como queda publicado; en cambio
    // `npm run dev` queda en la raiz y sigue abriendo en localhost:3000 seco.
    base: command === 'build' || isPreview ? '/GeoCartilla-Maquetado/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
