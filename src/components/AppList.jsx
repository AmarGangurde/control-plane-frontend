import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { Terminal, X, RefreshCw, Cpu, Activity, Pencil, Plus, Trash2, RotateCw } from 'lucide-react';

export default function AppList() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [logView, setLogView] = useState(null); // { id, name, logs, loading }
  const [editView, setEditView] = useState(null); // { app, image, port, env, command, args, loading, msg }
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

  // --- Edit Modal Helpers ---
  const openEditModal = (app) => {
    const envArray = app.env && Array.isArray(app.env) && app.env.length > 0
      ? app.env.map(e => ({ name: e.name || '', value: e.value || '' }))
      : [{ name: '', value: '' }];
    const argsArray = app.args && Array.isArray(app.args) && app.args.length > 0
      ? [...app.args]
      : [''];
    const cmdStr = app.command && Array.isArray(app.command) ? app.command.join(' ') : '';

    setEditView({
      app,
      image: app.image || '',
      port: app.container_port ? String(app.container_port) : '',
      env: envArray,
      command: cmdStr,
      args: argsArray,
      loading: false,
      msg: null
    });
  };

  const updateEditField = (field, value) => {
    setEditView(prev => ({ ...prev, [field]: value }));
  };

  const addEditEnvVar = () => {
    setEditView(prev => ({ ...prev, env: [...prev.env, { name: '', value: '' }] }));
  };
  const removeEditEnvVar = (index) => {
    setEditView(prev => ({ ...prev, env: prev.env.filter((_, i) => i !== index) }));
  };
  const updateEditEnvVar = (index, field, value) => {
    setEditView(prev => {
      const updated = [...prev.env];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, env: updated };
    });
  };

  const addEditArg = () => {
    setEditView(prev => ({ ...prev, args: [...prev.args, ''] }));
  };
  const removeEditArg = (index) => {
    setEditView(prev => ({ ...prev, args: prev.args.filter((_, i) => i !== index) }));
  };
  const updateEditArg = (index, value) => {
    setEditView(prev => {
      const updated = [...prev.args];
      updated[index] = value;
      return { ...prev, args: updated };
    });
  };

  const submitUpdate = async () => {
    if (!editView) return;
    setEditView(prev => ({ ...prev, loading: true, msg: null }));

    try {
      const filteredEnv = editView.env.filter(ev => ev.name.trim() !== '');
      const filteredArgs = editView.args.filter(a => a.trim() !== '');
      const parsedCommand = editView.command.trim() ? [editView.command.trim()] : undefined;

      const payload = {};

      // Only send changed fields
      if (editView.image !== editView.app.image) payload.image = editView.image.trim();
      const newPort = editView.port ? parseInt(editView.port, 10) : undefined;
      if (newPort && newPort !== editView.app.container_port) payload.port = newPort;
      if (filteredEnv.length > 0) payload.env = filteredEnv;
      else payload.env = [];
      if (parsedCommand) payload.command = parsedCommand;
      if (filteredArgs.length > 0) payload.args = filteredArgs;

      const res = await api.apps.update(editView.app.id, payload);

      setEditView(prev => ({
        ...prev,
        loading: false,
        msg: { type: 'success', text: res.message || 'Rolling update initiated!' }
      }));

      // Reload apps after a short delay to show the new status
      setTimeout(() => {
        window.dispatchEvent(new Event('apps:reload'));
      }, 1500);
    } catch (e) {
      setEditView(prev => ({
        ...prev,
        loading: false,
        msg: { type: 'error', text: e.message }
      }));
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
                <span className={`badge ${app.status === 'running' ? 'running' : app.status === 'failed' ? 'failed' : app.status === 'updating' ? 'updating' : 'pending'}`}>{app.status}</span>

                {/* Edit Button — only for running apps */}
                {app.status === 'running' && (
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all"
                    title="Edit & Update (Rolling)"
                  >
                    <Pencil size={16} />
                  </button>
                )}

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

      {/* Edit / Rolling Update Modal */}
      {editView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/80 backdrop-blur-sm" onClick={() => !editView.loading && setEditView(null)}>
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-400">
                  <RotateCw size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm tracking-tight">Rolling Update</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-tight">{editView.app.name} — zero-downtime deployment</p>
                </div>
              </div>
              <button
                onClick={() => !editView.loading && setEditView(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {editView.msg && (
                <div className={`p-3.5 rounded-xl text-sm font-semibold ${editView.msg.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                  {editView.msg.text}
                </div>
              )}

              {/* Docker Image */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Docker Image</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono text-sm"
                  placeholder="e.g. nginx:latest"
                  value={editView.image}
                  onChange={e => updateEditField('image', e.target.value)}
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Container Port</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono text-sm"
                  placeholder="Auto-detect (e.g. 80)"
                  value={editView.port}
                  onChange={e => updateEditField('port', e.target.value)}
                />
              </div>

              {/* Env Vars */}
              <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Environment Variables</label>
                  <button
                    type="button"
                    onClick={addEditEnvVar}
                    className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  {editView.env.map((ev, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder="KEY"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500/30 transition-all font-mono"
                        value={ev.name}
                        onChange={(e) => updateEditEnvVar(i, 'name', e.target.value)}
                      />
                      <input
                        placeholder="value"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500/30 transition-all font-mono"
                        value={ev.value}
                        onChange={(e) => updateEditEnvVar(i, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeEditEnvVar(i)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Command & Args */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                  <label className="block text-[11px] font-bold text-amber-400 mb-1.5 uppercase tracking-wider">Entrypoint (Command)</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                    placeholder="e.g. /usr/bin/node"
                    value={editView.command}
                    onChange={e => updateEditField('command', e.target.value)}
                  />
                </div>

                <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Arguments</label>
                    <button
                      type="button"
                      onClick={addEditArg}
                      className="p-1 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editView.args.map((arg, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          placeholder={`Arg ${i + 1}`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500/30 transition-all font-mono"
                          value={arg}
                          onChange={(e) => updateEditArg(i, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeEditArg(i)}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                          disabled={editView.args.length === 1 && arg === ''}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <div className="text-blue-400 mt-0.5 shrink-0">
                  <RotateCw size={14} />
                </div>
                <p className="text-[11px] text-blue-300/70 leading-relaxed font-medium">
                  <span className="text-blue-400 font-bold">Zero-downtime update:</span> Your current pod stays live while the new version starts. Traffic switches only after the new pod is healthy.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <button
                onClick={() => !editView.loading && setEditView(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitUpdate}
                disabled={editView.loading || !editView.image.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {editView.loading ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <RotateCw size={14} />
                    Deploy Update
                  </>
                )}
              </button>
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
