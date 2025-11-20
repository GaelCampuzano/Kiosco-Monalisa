// =============================================================
// Kiosco Sunset Monalisa - Service Worker v2.4 (Definitivo)
// =============================================================

const CACHE_NAME = 'kiosco-cache-v12'; 

const urlsToCache = [
  '/', '/index.html', '/admin.html',
  '/style.css', '/admin.css',
  '/app.js', '/admin.js', '/apiClient.js', '/indexedDB.js', '/i18n.js',
  '/i18n/es.json',
  '/i18n/en.json',
  '/assets/bkg.jpg', '/assets/Sunset-Monalisa-logo@2x_color.svg',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  '/api/waiters'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// --- GESTOR DE PETICIONES (FETCH) ROBUSTO Y DEFINITIVO ---
self.addEventListener('fetch', event => {
  const { request } = event;

  // Solo gestionamos peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia: Cache First (Primero Caché, luego Red)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Si el recurso existe en la caché, lo devolvemos inmediatamente.
      // Esto hará que los archivos de idioma funcionen offline.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si el recurso no está en la caché, intentamos obtenerlo de la red.
      return fetch(request).catch(() => {
        // Si la red falla (estamos offline) y el recurso no estaba en caché,
        // la petición simplemente falla, pero el .catch() evita que se muestre
        // el error de "promesa no capturada" en la consola.
        // Esto es útil para peticiones automáticas del navegador como favicon.ico.
      });
    })
  );
});


self.addEventListener('sync', event => {
    if (event.tag === 'sync-new-tips') {
        event.waitUntil(syncNewTips());
    }
});

async function syncNewTips() {
    const db = await openDB();
    const allTips = await getAllTips(db);
    
    if (!allTips || allTips.length === 0) return;

    let successCount = 0;

    for (const tip of allTips) {
        const payload = {
            table_number: tip.table_number,
            waiter_name: tip.waiter_name,
            tip_percentage: tip.tip_percentage,
            transaction_id: tip.transaction_id || `offline-${tip.id || Date.now()}`,
            device_id: tip.device_id
        };

        try {
            const response = await fetch('/api/tips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await deleteTip(db, tip.id);
                successCount++;
            }
        } catch (error) {
            console.error('Fallo de red al sincronizar, se reintentará.', error);
            return; 
        }
    }
    
    if (successCount > 0) {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach(client => {
            if (client) {
                client.postMessage({ type: 'SYNC_COMPLETE', count: successCount });
            }
        });
    }
}

function openDB() { return new Promise((resolve, reject) => { const request = indexedDB.open('kiosco-db', 1); request.onerror = () => reject("Error"); request.onsuccess = () => resolve(request.result); request.onupgradeneeded = e => e.target.result.createObjectStore('pending-tips', { keyPath: 'id', autoIncrement: true }); }); }
function getAllTips(db) { return new Promise((resolve, reject) => { const tx = db.transaction(['pending-tips'], 'readonly'); tx.objectStore('pending-tips').getAll().onsuccess = e => resolve(e.target.result); tx.onerror = () => reject("Error"); }); }
function deleteTip(db, id) { return new Promise((resolve, reject) => { const tx = db.transaction(['pending-tips'], 'readwrite'); tx.objectStore('pending-tips').delete(id).onsuccess = () => resolve(); tx.onerror = () => reject("Error"); }); }