const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const apiFetch = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Admin routes still use a Bearer token from localStorage
  if (options.admin) {
    const adminKey = localStorage.getItem('adminKey');
    if (adminKey) {
      headers.Authorization = `Bearer ${adminKey}`;
    }
  }

  const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Sends HttpOnly cookies automatically
  });

  if (!res.ok) {
    let err = {};
    try {
      err = await res.json();
    } catch (e) {
      err = { error: await res.text().catch(() => 'API error') };
    }
    throw new Error(err.error || 'API error');
  }

  return res.json();
};

export const api = {
  auth: {
    google: (id_token) => apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token })
    }),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    me: () => apiFetch('/auth/me'),
    createApiKey: () => apiFetch('/auth/api-key', { method: 'POST' }),
    getApiKeyStatus: () => apiFetch('/auth/api-key'),
  },
  apps: {
    list: () => apiFetch('/apps'),
    get: (id) => apiFetch(`/apps/${id}`),
    create: (data) => apiFetch('/apps', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiFetch(`/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiFetch(`/apps/${id}`, { method: 'DELETE' }),
    logs: (id) => apiFetch(`/apps/${id}/logs`)
  },
  billing: {
    plans: () => apiFetch('/billing/plans'),
    balance: () => apiFetch('/billing/balance'),
    topUp: (amount) => apiFetch('/billing/topup', {
      method: 'POST',
      body: JSON.stringify({ amount })
    })
  },
  databases: {
    list: () => apiFetch('/databases'),
    get: (id) => apiFetch(`/databases/${id}`),
    create: (data) => apiFetch('/databases', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    stop: (id) => apiFetch(`/databases/${id}/stop`, { method: 'POST' }),
    start: (id) => apiFetch(`/databases/${id}/start`, { method: 'POST' }),
    destroy: (id) => apiFetch(`/databases/${id}`, { method: 'DELETE' })
  }
};
