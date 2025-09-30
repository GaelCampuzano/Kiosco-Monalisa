const CACHE_NAME = 'kiosco-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/apiClient.js',
  '/indexedDB.js',
  '/assets/bkg.jpg',
  '/assets/Sunset-Monalisa-logo@2x_color.svg'
];

// Instalar el Service Worker y cachear los archivos de la aplicación
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar las peticiones y servir desde la caché si es posible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Escuchar el evento de sincronización para enviar datos pendientes
self.addEventListener('sync', event => {
    if (event.tag === 'sync-new-tips') {
        console.log('Sincronizando nuevas propinas...');
        event.waitUntil(syncNewTips());
    }
});

// Función para sincronizar los datos con el servidor
async function syncNewTips() {
    const db = await openDB();
    const allTips = await getAllTips(db);

    for (const tip of allTips) {
        try {
            const response = await fetch('/api/tips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tip),
            });

            if (response.ok) {
                console.log(`Propina ${tip.id} enviada correctamente.`);
                await deleteTip(db, tip.id);
            } else {
                 console.error(`Error al enviar la propina ${tip.id}:`, response.statusText);
            }
        } catch (error) {
            console.error('Fallo al enviar la propina, se reintentará más tarde:', error);
            // Si hay un error de red, la propina permanecerá en IndexedDB para el próximo intento.
        }
    }
}

// ---- Funciones de IndexedDB (replicadas para el scope del Service Worker) ----
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('kiosco-db', 1);
        request.onerror = () => reject("Error al abrir IndexedDB");
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('pending-tips', { keyPath: 'id', autoIncrement: true });
        };
    });
}

function getAllTips(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pending-tips'], 'readonly');
        const store = transaction.objectStore('pending-tips');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject("Error al obtener las propinas");
    });
}

function deleteTip(db, id) {
     return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pending-tips'], 'readwrite');
        const store = transaction.objectStore('pending-tips');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject("Error al borrar la propina");
    });
}