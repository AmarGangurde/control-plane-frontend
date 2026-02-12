import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { Terminal, X, RefreshCw, Cpu, Activity } from 'lucide-react';

export default function AppList() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [logView, setLogView] = useState(null); // { id, name, logs, loading }
  const logEndRef = useRef(null);

  const formatCpu = (cpu) => {
    if (!cpu || cpu === '0') return '0m';
    if (cpu.endsWith('n')) return `${Math.round(parseInt(cpu) / 1000000)}m`;
    return cpu;
  };

  const formatMem = (mem) => {
    if (!mem || mem === '0') return '0Mi';
    if (mem.endsWith('Ki')) return `${Math.round(parseInt(mem) / 1024)}Mi`;
    return mem;
  };

  const loadApps = async (opts = { background: false }) => {
    try {
      if (!opts.background) setLoading(true);
      const data = await api.apps.list();

      const withStatus = await Promise.all(
        data.map(async (a) => {
          try {
            const full = await api.apps.get(a.id);
            return { ...a, status: full.status, metrics: full.metrics };
          } catch (e) {
            return { ...a, status: 'unknown', metrics: { cpu: '0', memory: '0' } };
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

  const fetchLogs = async (appId, appName) => {
    setLogView({ id: appId, name: appName, logs: '', loading: true });
    try {
      const res = await api.apps.logs(appId);
      setLogView(prev => ({ ...prev, logs: res.logs, loading: false }));
    } catch (e) {
      setLogView(prev => ({ ...prev, logs: `Error: ${e.message}`, loading: false }));
    }
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logView?.logs]);

  useEffect(() => {
    loadApps();
    const onReload = () => loadApps({ background: true });
    window.addEventListener('apps:reload', onReload);
    const iv = setInterval(() => loadApps({ background: true }), 5000);

    return () => {
      window.removeEventListener('apps:reload', onReload);
      clearInterval(iv);
    };
  }, []);

  return (
    <div className="relative">
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-4 font-medium">{error}</div>}
      {loading && <div className="text-center py-12 text-slate-500 animate-pulse font-medium italic tracking-wide">Synchronizing with cluster v2...</div>}
      {!loading && (
        <ul className="app-list">
          {apps.map(app => (
            <li className="app-item group" key={app.id}>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  {app.name || 'Unnamed App'}
                  <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-black group-hover:bg-blue-500/10 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">{app.plan_id.replace('p-', '')}</span>
                </div>
                <div className="text-sm">
                  <a href={app.url} target="_blank" className="text-blue-500/70 hover:text-blue-400 transition-all underline decoration-blue-500/20 hover:decoration-blue-400/50">{app.url}</a>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{app.image}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5" title="CPU Usage">
                    <Cpu size={12} className="text-blue-500/50" />
                    {formatCpu(app.metrics?.cpu)}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5" title="Memory Usage">
                    <Activity size={12} className="text-purple-500/50" />
                    {formatMem(app.metrics?.memory)}
                  </div>
                  <div className="text-slate-600 pl-2 border-l border-white/5">
                    {getUptime(app.created_at)}
                  </div>
                </div>
                <span className={`badge ${app.status === 'running' ? 'running' : app.status === 'failed' ? 'failed' : 'pending'}`}>{app.status}</span>

                <button
                  onClick={() => fetchLogs(app.id, app.name)}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  title="View Logs"
                >
                  <Terminal size={16} />
                </button>

                <button
                  className="danger"
                  disabled={!!deleting[app.id]}
                  onClick={async () => {
                    if (!confirm('Delete this app?')) return;
                    setDeleting(d => ({ ...d, [app.id]: true }));
                    try {
                      await api.apps.delete(app.id);
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

      {/* Logs Modal */}
      {logView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">System Logs</h3>
                  <p className="text-[11px] text-slate-400 font-medium tracking-tight truncate max-w-[200px]">{logView.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(logView.id, logView.name)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  disabled={logView.loading}
                >
                  <RefreshCw size={18} className={logView.loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setLogView(null)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-black/40 font-mono text-[13px] leading-relaxed text-slate-300">
              {logView.loading ? (
                <div className="flex items-center justify-center h-full text-slate-500 animate-pulse italic">Retrieving streaming logs...</div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {logView.logs || 'No logs found for this container.'}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
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

