'use strict';
// Incrémenter VERSION après chaque publication pour renouveler le cache.
const VERSION = '2026-10-10-2';
const PREFIX = 'revise-stl-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + VERSION;
const ASSETS = [
  './.nojekyll',
  './app.js',
  './apple-touch-icon.png',
  './assets/diagrams/azeotrope.svg',
  './assets/diagrams/bilans.svg',
  './assets/diagrams/binaire.svg',
  './assets/diagrams/blocage.svg',
  './assets/diagrams/buchner.webp',
  './assets/diagrams/colori.svg',
  './assets/diagrams/conducti-reference.webp',
  './assets/diagrams/conducti.svg',
  './assets/diagrams/cristal.svg',
  './assets/diagrams/dean.webp',
  './assets/diagrams/derivee.svg',
  './assets/diagrams/direct.svg',
  './assets/diagrams/distillation-fractionnee.svg',
  './assets/diagrams/distillation-simple.svg',
  './assets/diagrams/energie-amortie.svg',
  './assets/diagrams/energie-libre.svg',
  './assets/diagrams/evapo.svg',
  './assets/diagrams/longitudinale.svg',
  './assets/diagrams/periode.svg',
  './assets/diagrams/ph.webp',
  './assets/diagrams/pka.svg',
  './assets/diagrams/potentio.webp',
  './assets/diagrams/qr.svg',
  './assets/diagrams/qualite.svg',
  './assets/diagrams/reflux.svg',
  './assets/diagrams/regimes.svg',
  './assets/diagrams/resonance.svg',
  './assets/diagrams/retard.svg',
  './assets/diagrams/tangentes.svg',
  './assets/diagrams/transversale.svg',
  './assets/fonts/dm-0.woff2',
  './assets/fonts/dm-1.woff2',
  './assets/fonts/dm-2.woff2',
  './assets/fonts/dm-3.woff2',
  './assets/fonts/fonts.css',
  './assets/fonts/OFL.txt',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon.svg',
  './assets/originals/appareil Dean et Stark1.jpg',
  './assets/originals/image (1).avif',
  './assets/originals/image (1).webp',
  './assets/originals/image (2).avif',
  './assets/originals/image (2).webp',
  './assets/originals/image (3).avif',
  './assets/originals/image (3).webp',
  './assets/originals/image.avif',
  './assets/originals/image.webp',
  './assets/originals/preview (1).webp',
  './assets/originals/preview (2).webp',
  './assets/originals/preview (3).webp',
  './assets/originals/preview (4).webp',
  './assets/originals/preview (5).webp',
  './assets/originals/preview (6).webp',
  './assets/originals/preview.webp',
  './data.json',
  './diagrams.json',
  './flashcards.json',
  './index.html',
  './manifest.json',
  './manipulations.json',
  './style.css',
  './supplements.json',
  './vendor/katex/contrib/auto-render.min.js',
  './vendor/katex/fonts/KaTeX_AMS-Regular.ttf',
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff',
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Bold.ttf',
  './vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff',
  './vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Caligraphic-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff',
  './vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Bold.ttf',
  './vendor/katex/fonts/KaTeX_Fraktur-Bold.woff',
  './vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Fraktur-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Fraktur-Regular.woff',
  './vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Main-Bold.ttf',
  './vendor/katex/fonts/KaTeX_Main-Bold.woff',
  './vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Main-BoldItalic.ttf',
  './vendor/katex/fonts/KaTeX_Main-BoldItalic.woff',
  './vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Italic.ttf',
  './vendor/katex/fonts/KaTeX_Main-Italic.woff',
  './vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Main-Regular.woff',
  './vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Math-BoldItalic.ttf',
  './vendor/katex/fonts/KaTeX_Math-BoldItalic.woff',
  './vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2',
  './vendor/katex/fonts/KaTeX_Math-Italic.ttf',
  './vendor/katex/fonts/KaTeX_Math-Italic.woff',
  './vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Bold.ttf',
  './vendor/katex/fonts/KaTeX_SansSerif-Bold.woff',
  './vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Italic.ttf',
  './vendor/katex/fonts/KaTeX_SansSerif-Italic.woff',
  './vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2',
  './vendor/katex/fonts/KaTeX_SansSerif-Regular.ttf',
  './vendor/katex/fonts/KaTeX_SansSerif-Regular.woff',
  './vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Script-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Script-Regular.woff',
  './vendor/katex/fonts/KaTeX_Script-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size1-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Size1-Regular.woff',
  './vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size2-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Size2-Regular.woff',
  './vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size3-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Size3-Regular.woff',
  './vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size4-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Size4-Regular.woff',
  './vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Typewriter-Regular.ttf',
  './vendor/katex/fonts/KaTeX_Typewriter-Regular.woff',
  './vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2',
  './vendor/katex/katex.min.css',
  './vendor/katex/katex.min.js',
  './vendor/katex/LICENSE',
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.href.startsWith(self.registration.scope)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (request.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      const cached = await cache.match(request);
      if (cached) return cached;
      return fetch(request);
    })(),
  );
});
