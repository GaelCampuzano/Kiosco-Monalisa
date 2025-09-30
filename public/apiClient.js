/**
 * =============================================================
 * API Client
 * -------------------------------------------------------------
 * Centraliza todas las llamadas fetch a la API del backend.
 * =============================================================
 */

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return null;
  }
  // Si la respuesta es un CSV, no la procesamos como JSON
  if (response.headers.get('Content-Type')?.includes('text/csv')) {
      return response;
  }
  return response.json();
}

const apiClient = {
  checkSession: () => {
    return fetch('/api/session').then(handleResponse);
  },

  login: (username, password) => {
    return fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handleResponse);
  },

  logout: () => {
    return fetch('/api/logout', { method: 'POST' }).then(handleResponse);
  },

  getTips: (filters = {}) => {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));
    const url = `/api/tips?${params.toString()}`;
    return fetch(url).then(handleResponse);
  },

  sendTip: (tipData) => {
    return fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipData),
    }).then(handleResponse);
  },

  /**
   * Descarga el reporte de propinas en formato CSV.
   * Apunta a la ruta correcta del backend: /api/tips/csv
   */
  downloadTipsCsv: (filters = {}) => {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));
    // URL CORREGIDA para coincidir con routes/api.js
    const url = `/api/tips/csv?${params.toString()}`; 
    
    return fetch(url).then(response => {
        if (!response.ok) {
            // Si hay un error, el backend puede enviar JSON
            return response.json().then(errorData => {
                throw new Error(errorData.error || `Error ${response.status}`);
            });
        }
        // Si todo va bien, devolvemos el objeto response para procesar el blob
        return response;
    });
  }
};