// Abrimos la base de datos de IndexedDB.
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('kiosco-db', 1);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            reject('Error al abrir IndexedDB');
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        // Si no existe, creamos la tabla para las propinas pendientes.
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending-tips')) {
                db.createObjectStore('pending-tips', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Guardamos una propina en IndexedDB para enviarla después.
async function saveTipOffline(tipData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pending-tips'], 'readwrite');
        const store = transaction.objectStore('pending-tips');
        const request = store.add(tipData);

        request.onsuccess = () => {
            console.log('Propina guardada localmente para sincronización.');
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error al guardar la propina en IndexedDB:', event.target.error);
            reject('Error al guardar la propina localmente.');
        };
    });
}