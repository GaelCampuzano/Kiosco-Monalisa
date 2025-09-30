/**
 * =============================================================
 * API Client v2.0
 * -------------------------------------------------------------
 * Centraliza todas las llamadas fetch a la API del backend.
 * Adaptado para autenticación por sesión.
 * =============================================================
 */

async function handleResponse(response) {
  // Si la respuesta es un CSV, no la procesamos como JSON
  if (response.headers.get('Content-Type')?.includes('text/csv')) {
      if (!response.ok) {
          // Si hay un error, el backend puede enviar JSON
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
  // --- Sesión ---
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

  // --- Datos ---
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
  
  getWaiters: () => {
    return fetch('/api/waiters').then(handleResponse);
  },

  downloadTipsCsv: (filters = {}) => {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));
    const url = `/api/tips/csv?${params.toString()}`;
    return fetch(url).then(handleResponse);
  }
};