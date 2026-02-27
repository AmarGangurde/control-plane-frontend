import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { Terminal, X, RefreshCw, Cpu, Activity, Pencil, Plus, Trash2, RotateCw, ExternalLink, Box, AlertCircle } from 'lucide-react';

export default function AppList() {
  const [apps, setApps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [logView, setLogView] = useState(null); // { id, name, logs, loading }
  const [editView, setEditView] = useState(null); // { app, image, port, env, command, args, loading, msg }
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const logEndRef = useRef(null);

  // --- Parsing Helpers ---

  // Convert CPU string to numeric millicores (m)
  const parseCpuToMillis = (cpu) => {
    if (!cpu) return 0;
    if (typeof cpu === 'number') return cpu;
    if (cpu.endsWith('n')) return Math.round(parseInt(cpu) / 1000000); // nanocores to m
    if (cpu.endsWith('m')) return parseInt(cpu); // millicores
    // If just number, assume cores, so * 1000
    if (!isNaN(cpu)) return parseFloat(cpu) * 1000;
    return 0;
  };

  // Convert Memory string to numeric MiB
  const parseMemToMiB = (mem) => {
    if (!mem) return 0;
    if (typeof mem === 'number') return mem;
    if (mem.endsWith('Ki')) return Math.round(parseInt(mem) / 1024);
    if (mem.endsWith('Mi')) return parseInt(mem);
    if (mem.endsWith('Gi')) return parseInt(mem) * 1024;
    if (!isNaN(mem)) return parseInt(mem) / (1024 * 1024); // Assume bytes if just number
    return 0;
  };

  const loadPlans = async () => {
    try {
      const res = await api.billing.plans();
      setPlans(res);
    } catch (e) {
      console.error("Failed to load plans", e);
    }
  };

  const loadApps = async (opts = { background: false }) => {
    try {
      if (!opts.background) setLoading(true);
      const data = await api.apps.list();

      const withStatus = await Promise.all(
        data.map(async (a) => {
          try {
            const full = await api.apps.get(a.id);
            return {
              ...a,
              status: full.status,
              metrics: full.metrics || { cpu: '0', memory: '0' }
            };
          } catch {
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

  useEffect(() => {
    loadPlans();
    loadApps();
    const onReload = () => loadApps({ background: true });
    window.addEventListener('apps:reload', onReload);
    const iv = setInterval(() => loadApps({ background: true }), 5000);

    return () => {
      window.removeEventListener('apps:reload', onReload);
      clearInterval(iv);
    };
  }, []);

  // --- Logs & Edit Helpers (Keep existing logic) ---
  const fetchLogs = async (appId, appName) => {
    setLogView({ id: appId, name: appName, logs: '', loading: true });
    try {
      const res = await api.apps.logs(appId);
      setLogView(prev => ({ ...prev, logs: res.logs, loading: false }));
    } catch (e) {
      setLogView(prev => ({ ...prev, logs: `Error: ${e.message}`, loading: false }));
    }
  };

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
      replicas: app.replicas ? String(app.replicas) : '1',
      env: envArray,
      command: cmdStr,
      args: argsArray,
      loading: false,
      msg: null
    });
  };

  // ... (Keep edit update helpers) ...
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
    // Auto-split logic
    if (value.trim().includes(' ') && !value.includes('\\ ')) {
      const parts = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
      if (parts && parts.length > 1) {
        setEditView(prev => {
          const cleanedParts = parts.map(p => p.replace(/^["']|["']$/g, ''));
          const updated = [...prev.args];
          updated.splice(index, 1, ...cleanedParts);
          return { ...prev, args: updated };
        });
        return;
      }
    }

    setEditView(prev => {
      const updated = [...prev.args];
      updated[index] = value;
      return { ...prev, args: updated };
    });
  };

  const getArgWarning = (val) => {
    if (!val) return null;
    if (val.startsWith('"') || val.endsWith('"') || val.startsWith("'") || val.endsWith("'")) {
      return "Leading/trailing quotes detected. The system handles quotes automatically.";
    }
    if (val.includes(',')) {
      return "Comma detected. Use separate fields for each argument index.";
    }
    if (val.trim().includes(' ') && !val.includes('"') && !val.includes("'")) {
      return "Multiple values detected. These should usually be separate fields.";
    }
    return null;
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
      const newReplicas = editView.replicas ? parseInt(editView.replicas, 10) : undefined;
      if (newReplicas !== undefined && newReplicas !== editView.app.replicas) payload.replicas = newReplicas;

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

  const handleDelete = async (id) => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(d => ({ ...d, [id]: true }));
    try {
      await api.apps.delete(id);
      setShowConfirmDelete(null);
      setDeleteConfirmText('');
      await loadApps();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(d => {
        const copy = { ...d };
        delete copy[id];
        return copy;
      });
    }
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logView?.logs]);


  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 font-medium animate-in fade-in slide-in-from-top-2">{error}</div>}

      {loading && !apps.length && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin text-blue-500 mb-4"><RefreshCw size={32} /></div>
          <div className="text-slate-500 font-medium italic tracking-wide">Synchronizing with cluster v2...</div>
        </div>
      )}

      {!loading && apps.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
          <div className="inline-flex p-4 rounded-full bg-slate-800 text-slate-500 mb-4">
            <Box size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Deployments Found</h3>
          <p className="text-slate-400">Launch your first deployment to get started.</p>
        </div>
      )}

      {apps.length > 0 && (
        <div className="bg-[#0f172a] shadow-sm rounded-2xl overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Deployment</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Resources</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Billing</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0f172a]">
                {apps.map(app => {
                  const plan = plans.find(p => p.id === app.plan_id);
                  const cpuLimit = plan ? parseCpuToMillis(plan.cpu) : 1000;
                  const memLimit = plan ? parseMemToMiB(plan.memory) : 512;

                  const currentCpu = parseCpuToMillis(app.metrics?.cpu);
                  const currentMem = parseMemToMiB(app.metrics?.memory);

                  const cpuPercent = Math.min((currentCpu / cpuLimit) * 100, 100);
                  const memPercent = Math.min((currentMem / memLimit) * 100, 100);

                  const baseHourlyRate = plan?.price_per_hour || 0;
                  const replicas = app.replicas || 1;
                  const hourlyRate = baseHourlyRate * replicas;
                  const totalCharged = app.total_charged || 0;

                  return (
                    <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 text-blue-400 border border-blue-500/20 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                            <Box className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white leading-tight mb-0.5 text-sm">{app.name || 'Unnamed'}</span>
                            <div className="flex items-center text-[10px] text-slate-500 font-mono gap-2">
                              {app.image}
                            </div>
                            {app.type === 'app' && (
                              <div className="flex items-center text-[10px] text-blue-400 font-black gap-2 mt-0.5 uppercase tracking-wide">
                                {replicas} {replicas > 1 ? 'Replicas' : 'Replica'}
                              </div>
                            )}
                            <a href={app.url} target="_blank" className="text-[10px] text-blue-500 hover:text-blue-400 hover:underline cursor-pointer truncate max-w-[150px] flex items-center gap-1 mt-0.5">
                              {app.url.replace('https://', '')}
                              <ExternalLink size={8} />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={app.status || 'unknown'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2 min-w-[180px]">
                          {/* Label for metrics */}
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mb-0.5 italic">
                            Per replica (sampled)
                          </div>
                          {/* CPU */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Cpu size={10} className="text-blue-400" />
                                <span>CPU</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-300">{currentCpu}m <span className="text-slate-600">/ {cpuLimit}m</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div className="bg-blue-500 h-full rounded-full relative" style={{ width: `${cpuPercent}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                              </div>
                            </div>
                          </div>

                          {/* Memory */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                <Activity size={10} className="text-purple-400" />
                                <span>MEM</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-300">{currentMem}Mi <span className="text-slate-600">/ {memLimit}Mi</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div className="bg-purple-500 h-full rounded-full relative" style={{ width: `${memPercent}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 w-fit">
                          <span className="text-[10px] text-blue-500/70 font-bold uppercase tracking-wider mb-0.5">
                            {plan?.id?.replace('p-', '') || 'custom'}
                          </span>
                          {hourlyRate > 0 && (
                            <div className="text-[9px] text-blue-400/80 font-medium mb-1">
                              ₹{(hourlyRate / 100).toFixed(2)}/hr · {replicas > 1 && <span className="text-[8px] opacity-70">({replicas}x)</span>}
                            </div>
                          )}
                          <span className="text-xs text-blue-500 font-bold uppercase tracking-wider">
                            ₹{(totalCharged / 100).toFixed(2)} <span className="text-[9px] font-normal opacity-70">paid</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-slate-500 font-mono">
                          {getUptime(app.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {app.status === 'running' && (
                            <button
                              onClick={() => openEditModal(app)}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => fetchLogs(app.id, app.name)}
                            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                            title="Logs"
                          >
                            <Terminal size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setShowConfirmDelete(app);
                              setDeleteConfirmText('');
                            }}
                            disabled={!!deleting[app.id]}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                            title="Delete"
                          >
                            {deleting[app.id] ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Deployment Logs</h3>
                  <p className="text-[11px] text-slate-500 font-medium tracking-tight truncate max-w-[200px]">{logView.name}</p>
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
                <div className="flex items-center justify-center h-full text-slate-500 animate-pulse italic">Retrieving streaming logs (sampled)...</div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {logView.logs || 'No logs found for this deployment.'}
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
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-400">
                  <RotateCw size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm tracking-tight">Scale & Update</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5 tracking-tight">{editView.app.name} — managed deployment</p>
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

              {/* Replicas */}
              {editView.app.type === 'app' && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-500 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                    Scaling (Replicas)
                    <span className="bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px] border border-amber-500/20">Cost Multiplier</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono text-sm"
                    value={editView.replicas}
                    onChange={e => updateEditField('replicas', e.target.value)}
                  />
                  <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tight">
                    Each additional replica increases hourly cost linearly (base rate &times; count).
                  </p>
                </div>
              )}

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
                    <div>
                      <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Arguments</label>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Separate values. No quotes.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addEditArg}
                      className="p-1 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editView.args.map((arg, i) => {
                      const warning = getArgWarning(arg);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex gap-2">
                            <input
                              placeholder={`Arg ${i + 1}`}
                              className={`flex-1 bg-white/5 border rounded-lg p-2 text-xs text-white focus:outline-none transition-all font-mono ${warning ? 'border-amber-500/50 focus:border-amber-500' : 'border-white/10 focus:border-amber-500/50'
                                }`}
                              value={arg}
                              onChange={(e) => updateArg(i, e.target.value)}
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
                          {warning && (
                            <div className="text-[8px] font-black text-amber-500 uppercase px-1">
                              {warning}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <div className="text-blue-400 mt-0.5 shrink-0">
                  <RotateCw size={14} />
                </div>
                <p className="text-[11px] text-blue-300/70 leading-relaxed font-medium">
                  <span className="text-blue-400 font-bold">Zero-downtime update:</span> Your current replicas stay live while the new versions start. Traffic switches only after new replicas are healthy.
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
                    Updating...
                  </>
                ) : (
                  <>
                    <RotateCw size={14} />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Destroy Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-[#0b0f1a] border border-red-500/30 rounded-[2.5rem] max-w-md w-full p-10 shadow-3xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tight">Destroy Deployment</h3>
            <p className="text-slate-400 text-center text-xs font-medium mb-8 leading-relaxed">
              Warning: This will permanently delete deployment <span className="text-white font-bold">{showConfirmDelete.name}</span> and all its replicas. This action is irreversible.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest text-center italic">Type <span className="text-white">DELETE</span> to confirm</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-white focus:outline-none focus:border-red-500 transition-all font-black uppercase placeholder:text-white/5"
                  placeholder="Required"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setShowConfirmDelete(null); setDeleteConfirmText(''); }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showConfirmDelete.id)}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase hover:bg-red-500 disabled:opacity-20 transition-all shadow-xl shadow-red-600/20"
                >
                  Destroy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    'running': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'failed': 'bg-red-500/10 text-red-400 border-red-500/20',
    'updating': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'unknown': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  const style = config[status.toLowerCase()] || config['unknown'];

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center w-fit ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${status.toLowerCase() === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-current opacity-50'}`}></span>
      {status}
    </span>
  );
}

function getUptime(dateString) {
  if (!dateString) return '';
  const start = new Date(dateString);
  if (isNaN(start.getTime())) return '';
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
