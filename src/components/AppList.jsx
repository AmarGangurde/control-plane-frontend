import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export default function AppList() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});

  const loadApps = async (opts = { background: false }) => {
    try {
      if (!opts.background) setLoading(true);
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
      if (!opts.background) setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
    const onReload = () => loadApps();
    window.addEventListener('apps:reload', onReload);
    // poll every 5s to update statuses
    const iv = setInterval(() => loadApps({ background: true }), 5000);

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
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  {app.name || 'Unnamed App'}
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{app.plan_id.replace('p-', '')}</span>
                </div>
                <div className="text-sm">
                  <a href={app.url} target="_blank" className="text-blue-600 hover:underline">{app.url}</a>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{app.image}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="text-xs text-slate-400 font-mono">
                  {getUptime(app.created_at)}
                </div>
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

function getUptime(dateString) {
  if (!dateString) return '';
  const start = new Date(dateString + 'Z');
  const now = new Date();
  const diff = now - start;

  if (diff < 0) return 'Just started';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
