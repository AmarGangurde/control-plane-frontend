import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import {
  Terminal, X, RefreshCw, Cpu, Activity, Pencil,
  Trash2, RotateCw, ExternalLink, Globe, Layout,
  Clock, Zap, Settings, BarChart3, AlertCircle, Plus
} from 'lucide-react';

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
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Application Instance</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Health Status</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Compute Usage</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Identity & Network</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apps.map(app => (
                <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                          <Layout size={20} />
                        </div>
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0f172a] ${app.status === 'running' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm tracking-tight">{app.name || 'Anonymous Service'}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">{app.plan_id.replace('p-', '')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-medium">
                          <Clock size={12} className="opacity-50" />
                          {getUptime(app.created_at)} online
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <StatusBadge status={app.status} />
                      {app.status === 'running' && (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-500/70 font-bold uppercase tracking-tighter">
                          <Activity size={10} className="animate-pulse" />
                          Live Streaming
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="w-48 space-y-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span className="flex items-center gap-1"><Cpu size={10} className="text-blue-500/50" /> CPU Load</span>
                          <span className="text-blue-400 font-mono">{formatCpu(app.metrics?.cpu)}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: '25%' }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                          <span className="flex items-center gap-1"><Zap size={10} className="text-purple-500/50" /> RAM Commit</span>
                          <span className="text-purple-400 font-mono">{formatMem(app.metrics?.memory)}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" style={{ width: '45%' }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <a href={app.url} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                        <Globe size={13} />
                        {app.url.replace('https://', '')}
                        <ExternalLink size={10} className="opacity-50" />
                      </a>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[180px] bg-white/5 px-1.5 py-0.5 rounded-md inline-block w-fit border border-white/5">
                        {app.image}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => fetchLogs(app.id, app.name)}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group/btn"
                        title="Streaming Logs"
                      >
                        <Terminal size={16} className="group-hover/btn:scale-110 transition-transform" />
                      </button>

                      {app.status === 'running' && (
                        <button
                          onClick={() => openEditModal(app)}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all group/btn"
                          title="Configuration"
                        >
                          <Settings size={16} className="group-hover/btn:rotate-45 transition-transform" />
                        </button>
                      )}

                      <button
                        disabled={!!deleting[app.id]}
                        onClick={async () => {
                          if (!confirm('Permanently decommission this instance?')) return;
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
                        className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                      >
                        {deleting[app.id] ? <RotateCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {apps.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center p-32 text-center">
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 mb-8 text-slate-600 animate-pulse transition-all">
              <Layout size={64} strokeWidth={0.5} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Zero Cloud Instances Found</h3>
            <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed uppercase tracking-wider text-[10px]">Your deployed applications will manifest here in real-time with live telemetry and rolling updates.</p>
          </div>
        )}

        {loading && (
          <div className="p-32 text-center animate-pulse">
            <div className="inline-flex items-center gap-3 text-blue-400 font-black tracking-[0.3em] uppercase text-[10px] px-8 py-3 rounded-full bg-blue-500/10 border border-blue-500/20">
              <RotateCw size={14} className="animate-spin" />
              Cluster Internal Synchronization...
            </div>
          </div>
        )}
      </div>

      {/* Logs Modal */}
      {logView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-widest">Instance Kernel Logs</h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5 tracking-tight flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    STREAMING FROM: <span className="text-slate-400 font-mono">{logView.name}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(logView.id, logView.name)}
                  className="p-3 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                  disabled={logView.loading}
                >
                  <RefreshCw size={20} className={logView.loading ? 'animate-spin text-blue-400' : ''} />
                </button>
                <button
                  onClick={() => setLogView(null)}
                  className="p-3 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-black/40 font-mono text-[12px] leading-relaxed text-slate-300 custom-scrollbar">
              {logView.loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 animate-pulse font-black uppercase tracking-[0.2em]">
                  <RotateCw size={32} className="animate-spin opacity-20" />
                  Hooking process stream...
                </div>
              ) : (
                <pre className="whitespace-pre-wrap selection:bg-blue-500/30">
                  {logView.logs || 'No logs found for this container.'}
                  <div ref={logEndRef} />
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit / Rolling Update Modal */}
      {editView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => !editView.loading && setEditView(null)}>
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-7 border-b border-white/5 bg-white/[0.03]">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/20 p-3 rounded-2xl text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <RotateCw size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-widest">Rolling Deploy Pipeline</h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5 tracking-tight uppercase">Configuring Environment: <span className="text-amber-400 font-mono">{editView.app.name}</span></p>
                </div>
              </div>
              <button
                onClick={() => !editView.loading && setEditView(null)}
                className="p-3 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {editView.msg && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in bounce-in duration-500 ${editView.msg.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                  {editView.msg.type === 'success' ? <RefreshCw size={16} /> : <AlertCircle size={16} />}
                  {editView.msg.text}
                </div>
              )}

              <div className="grid gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">Application Repository/Image</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono text-sm shadow-inner"
                    placeholder="e.g. registry.com/user/image:v1.0.0"
                    value={editView.image}
                    onChange={e => updateEditField('image', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">Exposed Network Port</label>
                  <div className="relative">
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono text-sm shadow-inner"
                      placeholder="8080"
                      value={editView.port}
                      onChange={e => updateEditField('port', e.target.value)}
                    />
                    <Globe size={18} className="absolute left-4 top-4 text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="p-7 bg-black/30 rounded-[2rem] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Custom Env Engine</label>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Inject secure variables into container runtime</p>
                  </div>
                  <button
                    type="button"
                    onClick={addEditEnvVar}
                    className="p-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all active:scale-90"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  {editView.env.map((ev, i) => (
                    <div key={i} className="flex gap-3 group/env animate-in slide-in-from-left-2 transition-all">
                      <input
                        placeholder="VAR_NAME"
                        className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-[11px] text-white focus:outline-none focus:border-amber-500/30 transition-all font-mono shadow-inner"
                        value={ev.name}
                        onChange={(e) => updateEditEnvVar(i, 'name', e.target.value)}
                      />
                      <input
                        placeholder="VALUE"
                        className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-3 text-[11px] text-white focus:outline-none focus:border-amber-500/30 transition-all font-mono shadow-inner"
                        value={ev.value}
                        onChange={(e) => updateEditEnvVar(i, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeEditEnvVar(i)}
                        className="p-3 text-slate-600 hover:text-red-400 transition-colors active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl relative overflow-hidden group/tip">
                <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover/tip:rotate-12 transition-transform">
                  <RotateCw size={64} />
                </div>
                <div className="text-blue-400 mt-1 shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <span className="text-blue-400 font-black text-[10px] uppercase tracking-widest block mb-1">Zero-Downtime Verification</span>
                  <p className="text-[11px] text-blue-300/70 leading-relaxed font-bold uppercase tracking-tighter">
                    Current pod remains operational during build. Traffic is routed only after readiness probes pass on the new revision.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-7 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
              <button
                onClick={() => !editView.loading && setEditView(null)}
                className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
              >
                Abort Pipeline
              </button>
              <button
                onClick={submitUpdate}
                disabled={editView.loading || !editView.image.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-black px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:scale-95"
              >
                {editView.loading ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    PUSHING REVISION...
                  </>
                ) : (
                  <>
                    <RotateCw size={16} />
                    INITIALIZE DEPLOY
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

function StatusBadge({ status }) {
  const configs = {
    'running': 'bg-green-500/10 text-green-400 border-green-500/30',
    'stopped': 'bg-red-500/10 text-red-400 border-red-500/30', // Actually backend uses 'stopped' but k8s might say 'terminated'
    'failed': 'bg-red-500/10 text-red-400 border-red-500/30',
    'updating': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'unknown': 'bg-slate-500/10 text-slate-400 border-slate-500/30'
  }

  const style = configs[status] || configs['pending']

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${style}`}>
      <span className={`w-1 h-1 rounded-full mr-1.5 ${status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-current opacity-50'}`} />
      {status}
    </span>
  )
}

function getUptime(dateString) {
  if (!dateString) return '';
  const start = new Date(dateString);
  if (isNaN(start.getTime())) return '';
  const now = new Date();
  const diff = now - start;

  if (diff < 0) return 'Just now';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
