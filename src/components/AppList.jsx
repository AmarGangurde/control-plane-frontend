import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import {
  Terminal, X, RefreshCw, Cpu, Activity, Pencil, Plus,
  Trash2, RotateCw, ExternalLink, Box, AlertCircle,
  ChevronRight, Gauge, Layers, Globe, Clock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppList() {
  const [apps, setApps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [logView, setLogView] = useState(null);
  const [editApp, setEditApp] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [appsData, plansData] = await Promise.all([
        api.apps.list(),
        api.billing.plans()
      ]);
      setApps(appsData);
      setPlans(plansData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    window.addEventListener('apps:reload', loadAll);
    const interval = setInterval(() => {
      // Silent reload for status/metrics
      api.apps.list().then(setApps).catch(console.error);
    }, 10000);
    return () => {
      window.removeEventListener('apps:reload', loadAll);
      clearInterval(interval);
    };
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Critical: Are you sure you want to decommission ${name}?`)) return;
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      await api.apps.delete(id);
      setApps(apps.filter(a => a.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Activity size={10} /> },
      pending: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <Clock size={10} /> },
      failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertCircle size={10} /> },
      updating: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <RotateCw size={10} className="animate-spin" /> }
    };
    const c = config[status?.toLowerCase()] || config.pending;
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${c.bg} ${c.color} ${c.border} text-[8px] font-black uppercase tracking-widest`}>
        {c.icon}
        {status || 'Unknown'}
      </div>
    );
  };

  if (loading && apps.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass h-64 rounded-[2rem] animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">Compute Clusters</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Real-time container orchestration state</p>
        </div>
        <button
          onClick={loadAll}
          className="p-3 glass rounded-2xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="glass p-20 rounded-[3rem] text-center border border-dashed border-white/10">
          <div className="bg-blue-600/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
            <Box size={40} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">No active clusters found</h3>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Provision your first instance above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                plan={plans.find(p => p.id === app.plan_id)}
                onDelete={() => handleDelete(app.id, app.name)}
                onLogs={() => setLogView(app)}
                onEdit={() => setEditApp(app)}
                deleting={deleting[app.id]}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {logView && <LogsModal app={logView} onClose={() => setLogView(null)} />}
      {editApp && <EditModal app={editApp} plans={plans} onClose={() => setEditApp(null)} onUpdate={loadAll} />}
    </div>
  );
}

function AppCard({ app, plan, onDelete, onLogs, onEdit, deleting }) {
  const stats = app.stats || { cpu: '0%', memory: '0Mi', restarts: 0 };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass rounded-[2.5rem] p-8 border border-white/5 hover:border-blue-500/30 transition-all duration-500 relative group overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/10 p-3.5 rounded-2xl border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
            <Box size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white group-hover:text-blue-400 transition-colors uppercase">{app.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={app.status} />
              {app.replicas > 1 && (
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                  x{app.replicas} Replicas
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={onEdit} className="p-2 glass rounded-xl text-slate-400 hover:text-white hover:bg-blue-600/20">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} disabled={deleting} className="p-2 glass rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-50">
            {deleting ? <RotateCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Globe size={12} className="text-blue-500" /> Ingress Endpoint
            </span>
            <a href={app.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
              <ExternalLink size={14} />
            </a>
          </div>
          <div className="text-[11px] font-bold text-slate-300 font-mono truncate bg-white/5 p-2 rounded-lg">
            {app.url}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Cpu size={10} className="text-blue-500" /> CPU Allocation
            </div>
            <div className="text-sm font-black text-white">{stats.cpu}</div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(parseFloat(stats.cpu) * 10, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Layers size={10} className="text-emerald-500" /> RAM Utilization
            </div>
            <div className="text-sm font-black text-white">{stats.memory}</div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: '40%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Pricing Plan</span>
          <span className="text-xs font-black text-blue-500 uppercase">{plan?.name || 'Standard'}</span>
        </div>
        <button
          onClick={onLogs}
          className="bg-white text-slate-950 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Terminal size={14} /> Live Logs
        </button>
      </div>
    </motion.div>
  );
}

function LogsModal({ app, onClose }) {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();

  useEffect(() => {
    let interval;
    const fetchLogs = async () => {
      try {
        const data = await api.apps.logs(app.id);
        setLogs(data.logs);
      } catch (e) {
        setLogs('ERR: Could not establish secure socket tunnel to kernel.\n' + e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [app.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-5xl h-[80vh] rounded-[3rem] overflow-hidden flex flex-col border border-white/10"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
              <Terminal size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase">{app.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Live STDOUT/STDERR stream</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 glass rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <X size={24} />
          </button>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 p-8 overflow-y-auto font-mono text-xs bg-black/40 text-blue-100/80 custom-scrollbar leading-relaxed"
        >
          {loading ? (
            <div className="flex items-center gap-3 text-blue-500 font-bold uppercase tracking-widest animate-pulse">
              <RotateCw size={14} className="animate-spin" /> Calibrating Data Stream...
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">{logs || 'Waiting for system metrics...'}</pre>
          )}
        </div>
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Stream Active
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span>Frequency: 5000ms</span>
          </div>
          <button onClick={() => setLogs('')} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors">
            Flush Terminal
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EditModal({ app, plans, onClose, onUpdate }) {
  const [replicas, setReplicas] = useState(app.replicas);
  const [loading, setLoading] = useState(false);

  const handleScale = async () => {
    setLoading(true);
    try {
      await api.apps.update(app.id, { replicas: parseInt(replicas) });
      onUpdate();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-xl p-10 rounded-[3rem] border border-white/10"
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-indigo-600 rounded-2xl">
              <Gauge size={24} className="text-white" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white uppercase">Scaling Engine</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Horizontal Scale</label>
              <span className="text-3xl font-black text-white">{replicas} <span className="text-xs text-slate-600">PODS</span></span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={replicas}
              onChange={e => setReplicas(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              <span>Single Process</span>
              <span>Global Distribution</span>
            </div>
          </div>

          <div className="p-6 bg-indigo-600/5 rounded-2xl border border-indigo-500/10 flex items-start gap-4">
            <Zap size={20} className="text-indigo-400 shrink-0" />
            <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed">
              Updating scale will trigger a <span className="text-indigo-400 font-bold">Rolling Update</span>. New pods will be provisioned before legacy ones are terminated to ensure zero downtime.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-2xl glass font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleScale}
              disabled={loading}
              className="flex-1 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? 'Propagating...' : 'Commit Scale'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
