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

  const res = await fetch(`${API_BASE}${path}`, {
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
