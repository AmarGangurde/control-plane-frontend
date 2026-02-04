import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export default function AppList() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});

  const loadApps = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/apps');

      const withStatus = await Promise.all(
        data.map(async (a) => {
          try {
            const full = await apiFetch(`/apps/${a.id}`);
            return { ...a, status: full.status };
          } catch (e) {
            return { ...a, status: 'unknown' };
          }
        })
      );

      setApps(withStatus);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
    const onReload = () => loadApps();
    window.addEventListener('apps:reload', onReload);
    // poll every 5s to update statuses
    const iv = setInterval(loadApps, 5000);

    return () => {
      window.removeEventListener('apps:reload', onReload);
      clearInterval(iv);
    };
  }, []);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading apps…</p>}
      {!loading && (
        <ul className="app-list">
          {apps.map(app => (
            <li className="app-item" key={app.id}>
              <div>
                <a href={app.url} target="_blank">{app.url}</a>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{app.image}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${app.status === 'running' ? 'running' : app.status === 'failed' ? 'failed' : 'pending'}`}>{app.status}</span>
                <button
                  className="danger"
                  disabled={!!deleting[app.id]}
                  onClick={async () => {
                    if (!confirm('Delete this app?')) return;
                    setDeleting(d => ({ ...d, [app.id]: true }));
                    try {
                      await apiFetch(`/apps/${app.id}`, { method: 'DELETE' });
                      await loadApps();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setDeleting(d => {
                        const copy = { ...d };
                        delete copy[app.id];
                        return copy;
                      });
                    }
                  }}
                >{deleting[app.id] ? 'Deleting…' : 'Delete'}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
