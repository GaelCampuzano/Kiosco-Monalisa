async function handleResponse(response) {
  if (response.headers.get('Content-Type')?.includes('text/csv')) {
      if (!response.ok) {
          return response.json().then(errorData => {
              throw new Error(errorData.error || `Error ${response.status}`);
          });
      }
      return response;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

const apiClient = {
  checkSession: () => fetch('/api/session').then(handleResponse),

  login: (username, password) => fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
  }).then(handleResponse),

  logout: () => fetch('/api/logout', { method: 'POST' }).then(handleResponse),

  getTips: (filters = {}, page = 1, limit = 10) => {
    const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        page,
        limit
    });
    const url = `/api/tips?${params.toString()}`;
    return fetch(url).then(handleResponse);
  },

  // ===========================================================================
  // 🚨 CORRECCIÓN PRINCIPAL: Timeout de 5 segundos
  // Si el servidor no responde en 5s (Neon despertando), cortamos y guardamos offline.
  // ===========================================================================
  sendTip: async (tipData) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos máximo de espera

    try {
        const response = await fetch('/api/tips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tipData),
            signal: controller.signal
        });
        clearTimeout(timeoutId); // Si respondió a tiempo, limpiamos el reloj
        return handleResponse(response);
    } catch (error) {
        clearTimeout(timeoutId);
        // Si el error fue por tiempo (AbortError), lanzamos un error específico 
        // que app.js entenderá como "No hay conexión estable" y guardará en IndexedDB.
        if (error.name === 'AbortError') {
            throw new Error('Timeout: El servidor tardó demasiado, guardando offline.');
        }
        throw error;
    }
  },
  // ===========================================================================

  getWaiters: () => fetch('/api/waiters').then(handleResponse),

  downloadTipsCsv: (filters = {}) => {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));
    const url = `/api/tips/csv?${params.toString()}`;
    return fetch(url).then(handleResponse);
  }
};