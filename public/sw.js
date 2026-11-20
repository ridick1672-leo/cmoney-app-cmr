/**
 * C-MONEY V7 — ZERO-CACHE SERVICE WORKER (NETWORK-ONLY)
 * - Memenuhi syarat tombol "Install" resmi di Chrome/Edge/Samsung Android lama & baru
 * - TIDAK menyimpan cache HTML/JS/CSS/API agar Saldo Kas 100% Live
 * - 100% aman saat rollback GitHub ke v6.3-absen-stable (tidak akan stuck cache)
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Bersihkan cache lama bila pernah ada sebelumnya
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', () => {
  // Sengaja dibiarkan pasif (network-only) agar seluruh data & kode selalu terbaru dari server
});