const getEnv = (key) => (window._env_ && window._env_[key]) || import.meta.env[key];

const VITE_API_BASE = getEnv('VITE_API_BASE');
export const API_BASE = (VITE_API_BASE && VITE_API_BASE !== 'undefined') ? VITE_API_BASE : '';

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

  const baseUrl = API_BASE ? (API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`) : '/api';
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
    // Docker Registry Token
    updateDockerToken: (username, token) => apiFetch('/auth/docker-token', {
      method: 'POST',
      body: JSON.stringify({ username, token })
    }),
    getDockerTokenStatus: () => apiFetch('/auth/docker-token'),
    deleteDockerToken: () => apiFetch('/auth/docker-token', { method: 'DELETE' }),
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
    logs: (id, container) => apiFetch(`/apps/${id}/logs${container ? `?container=${encodeURIComponent(container)}` : ''}`),
    setAlias: (id, slug) => apiFetch(`/apps/${id}/alias`, {
      method: 'PUT',
      body: JSON.stringify({ slug })
    }),
    removeAlias: (id) => apiFetch(`/apps/${id}/alias`, { method: 'DELETE' }),
    checkAlias: (slug) => apiFetch(`/apps/alias/check?slug=${encodeURIComponent(slug)}`),
  },
  reservedAliases: {
    list: () => apiFetch('/aliases'),
    reserve: (slug) => apiFetch('/aliases', { method: 'POST', body: JSON.stringify({ slug }) }),
    assign: (id, appId) => apiFetch(`/aliases/${id}/assign`, { method: 'PUT', body: JSON.stringify({ appId }) }),
    unassign: (id) => apiFetch(`/aliases/${id}/assign`, { method: 'PUT', body: JSON.stringify({ appId: null }) }),
    release: (id) => apiFetch(`/aliases/${id}`, { method: 'DELETE' }),
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
  },
  support: {
    createContact: (data) => apiFetch('/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    listTickets: () => apiFetch('/tickets'),
    createTicket: (data) => apiFetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getTicketMessages: (id) => apiFetch(`/tickets/${id}/messages`),
    replyTicket: (id, message) => apiFetch(`/tickets/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),
    // Admin Support
    adminListContacts: () => apiFetch('/admin/contacts', { admin: true }),
    adminUpdateContactStatus: (id, status) => apiFetch(`/admin/contacts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      admin: true
    }),
    adminListTickets: () => apiFetch('/admin/tickets', { admin: true }),
    adminGetTicket: (id) => apiFetch(`/admin/tickets/${id}`, { admin: true }),
    adminReplyTicket: (id, message) => apiFetch(`/admin/tickets/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      admin: true
    })
  }
};
