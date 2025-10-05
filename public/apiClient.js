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

  // --- FUNCIÓN MODIFICADA PARA PAGINACIÓN ---
  getTips: (filters = {}, page = 1, limit = 10) => {
    const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        page,
        limit
    });
    const url = `/api/tips?${params.toString()}`;
    return fetch(url).then(handleResponse);
  },

  sendTip: (tipData) => fetch('/api/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipData),
  }).then(handleResponse),

  getWaiters: () => fetch('/api/waiters').then(handleResponse),

  downloadTipsCsv: (filters = {}) => {
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));
    const url = `/api/tips/csv?${params.toString()}`;
    return fetch(url).then(handleResponse);
  }
};