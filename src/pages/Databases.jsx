import { useState, useEffect } from 'react';
import { api, API_BASE } from '../api/client';
import {
    Database, Plus, Trash2, Copy, CheckCircle2, RefreshCw,
    AlertCircle, HardDrive, Server, Power, X, ExternalLink,
    Cpu, Activity, ShieldCheck, Info, CloudDownload, Sparkles,
    Search, Filter, ChevronRight, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const maskUrl = (url) => url ? url.replace(/:([^:@]+)(?=@)/, ':••••••••') : '';

export default function Databases() {
    const [dbs, setDbs] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dbData, planData] = await Promise.all([
                api.databases.list(),
                api.billing.plans()
            ]);
            setDbs(dbData);
            setPlans(planData.filter(p => p.id.startsWith('db-')));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            api.databases.list().then(setDbs).catch(console.error);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'stop') await api.databases.stop(id);
            else if (action === 'start') await api.databases.start(id);
            else if (action === 'delete') {
                if (!window.confirm("Critical: Persistent data will be purged. Proceed?")) return;
                await api.databases.destroy(id);
            }
            loadData();
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <Database size={20} className="text-emerald-400" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Managed Clusters</h2>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] ml-1">Automated stateful service orchestration</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="group relative overflow-hidden bg-emerald-600 text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Plus size={18} /> Provision Cluster
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                </button>
            </div>

            {loading && dbs.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2].map(i => (
                        <div key={i} className="glass h-80 rounded-[3rem] animate-pulse border border-white/5" />
                    ))}
                </div>
            ) : dbs.length === 0 ? (
                <div className="glass p-32 rounded-[4rem] text-center border border-dashed border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                        <Database size={400} className="text-emerald-500 -translate-x-1/2 -translate-y-1/2 mt-[20%] ml-[50%]" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-emerald-600/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                            <Database size={48} className="text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">No active clusters provisioned</h3>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest max-w-sm mx-auto leading-relaxed italic">
                            Deploy high-availability Postgres or Redis clusters with a single click.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence mode="popLayout">
                        {dbs.map((db) => (
                            <DatabaseCard
                                key={db.id}
                                db={db}
                                plan={plans.find(p => p.id === db.plan_id)}
                                onAction={handleAction}
                                onCopy={copyToClipboard}
                                isCopied={copiedId === db.id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {showCreateModal && (
                <CreateModal
                    plans={plans}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={loadData}
                />
            )}
        </div>
    );
}

function DatabaseCard({ db, plan, onAction, onCopy, isCopied }) {
    const isRunning = db.status === 'running';
    const isPostgres = db.name.toLowerCase().includes('pg') || db.name.toLowerCase().includes('sql');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-[3.5rem] p-10 border border-white/5 hover:border-emerald-500/30 transition-all duration-700 relative group overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-emerald-500 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                <Database size={180} />
            </div>

            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                    <div className="bg-emerald-600/10 p-5 rounded-[1.75rem] border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-2xl shadow-emerald-600/10">
                        {isPostgres ? <Server size={32} /> : <HardDrive size={32} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black tracking-tight text-white uppercase italic">{db.name}</h3>
                            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRunning ? 'Active Engine' : 'Engine Halted'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">{plan?.name || 'Standard Cluster'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onAction(db.id, isRunning ? 'stop' : 'start')}
                        className={`p-3 glass rounded-2xl transition-all ${isRunning ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                        <Power size={20} />
                    </button>
                    <button
                        onClick={() => onAction(db.id, 'delete')}
                        className="p-3 glass rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-6 mb-10">
                <div className="bg-black/30 p-6 rounded-[2rem] border border-white/5 relative group/conn">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" /> Secure Connection String
                        </span>
                        <button
                            onClick={() => onCopy(db.url, db.id)}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase"
                        >
                            {isCopied ? 'Synchronized!' : 'Copy String'}
                        </button>
                    </div>
                    <div className="text-[11px] font-bold text-slate-300 font-mono break-all line-clamp-2 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover/conn:border-emerald-500/20 transition-colors">
                        {maskUrl(db.url)}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <MetricBox icon={<Cpu size={14} />} label="Load" value="0.2%" color="blue" />
                    <MetricBox icon={<Activity size={14} />} label="IOPS" value="2.4k" color="emerald" />
                    <MetricBox icon={<Layers size={14} />} label="Vol" value="2.1 GB" color="purple" />
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic leading-none mb-1">Backup frequency</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">Every 24 Hours</span>
                </div>
                <button
                    onClick={() => alert('Provisioning ephemeral download link...')}
                    className="bg-white text-slate-950 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-white/5"
                >
                    <CloudDownload size={18} /> Snapshot
                </button>
            </div>
        </motion.div>
    );
}

function MetricBox({ icon, label, value, color }) {
    const colors = {
        blue: 'text-blue-500 bg-blue-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        purple: 'text-purple-500 bg-purple-500/10'
    };
    return (
        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
            <div className={`p-2 rounded-xl mb-2 ${colors[color]}`}>{icon}</div>
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-xs font-black text-white">{value}</div>
        </div>
    );
}

function CreateModal({ plans, onClose, onCreated }) {
    const [name, setName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('db-small');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.databases.create({ name, planId: selectedPlan });
            onCreated();
            onClose();
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-3xl">
            <motion.form
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={submit}
                className="glass w-full max-w-4xl p-12 rounded-[4rem] border border-white/10 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Sparkles size={120} className="text-emerald-500" />
                </div>

                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic">Cluster Initialization</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Configure your managed database state</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-4 glass rounded-[1.5rem] text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-10">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Cluster Identifier</label>
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-black placeholder:text-white/10"
                            placeholder="e.g. USER-PROD-REPLICA-1"
                            value={name}
                            required
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-6 uppercase tracking-[0.2em]">Allocation Plan</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map(p => {
                                const isSelected = selectedPlan === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPlan(p.id)}
                                        className={`p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${isSelected ? 'bg-emerald-600 border-emerald-600 shadow-2xl shadow-emerald-600/30 -translate-y-2' : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/20'}`}
                                    >
                                        <div className={`text-xl font-black mb-1 ${isSelected ? 'text-white' : 'text-slate-100'}`}>{p.name}</div>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>{p.cpu} / {p.memory}</div>
                                        <div className={`text-base font-black ${isSelected ? 'text-white' : 'text-emerald-400'}`}>₹{(p.price_per_hour / 100).toFixed(2)}/h</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10 italic">
                        <Zap size={24} className="text-emerald-500 shrink-0" />
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                            Initializing a new cluster will trigger automated <span className="text-emerald-400">Security Groups</span> and <span className="text-emerald-400">WAL archival</span>. Provisioning time ~60s.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-slate-950 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/5 disabled:opacity-30"
                    >
                        {loading ? 'Initializing Engine...' : 'Authorize Provisioning'}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
