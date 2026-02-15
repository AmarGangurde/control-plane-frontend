const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const apiFetch = async (path, options = {}) => {
  const apiKey = localStorage.getItem('apiKey');
  const adminKey = localStorage.getItem('adminKey');

  const authHeader = options.admin
    ? adminKey
      ? `Bearer ${adminKey}`
      : null
    : apiKey
      ? `Bearer ${apiKey}`
      : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers || {})
  };

  const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
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
    })
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
  }
};
