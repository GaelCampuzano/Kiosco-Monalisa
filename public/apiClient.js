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
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != '')));
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
};