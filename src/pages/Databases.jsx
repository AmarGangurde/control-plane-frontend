import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
    Database, Plus, Trash2, Copy, CheckCircle2, RefreshCw,
    AlertCircle, HardDrive, Server, Power, X, ExternalLink,
    Cpu, Activity, ShieldCheck, Info
} from 'lucide-react';

export default function Databases() {
    const [databases, setDatabases] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState('db-small');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [createMsg, setCreateMsg] = useState(null);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [newDbDetails, setNewDbDetails] = useState(null);
    const [showConfirmDestroy, setShowConfirmDestroy] = useState(null);
    const [destroyConfirmText, setDestroyConfirmText] = useState('');

    const loadData = async (opts = { background: false }) => {
        try {
            if (!opts.background) setLoading(true);
            const [dbList, allPlans] = await Promise.all([
                api.databases.list(),
                api.billing.plans()
            ]);
            setDatabases(dbList);
            setPlans(allPlans.filter(p => p.id.startsWith('db-')));
        } catch (e) {
            setError(e.message);
        } finally {
            if (!opts.background) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const iv = setInterval(() => loadData({ background: true }), 10000);
        return () => clearInterval(iv);
    }, []);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setCreating(true);
        setCreateMsg(null);
        setNewDbDetails(null);
        try {
            const data = await api.databases.create({ name: name.trim(), planId: selectedPlan });
            setCreateMsg({ type: 'success', text: `Database "${data.name}" is being provisioned!` });
            setNewDbDetails(data);
            setName('');
            loadData({ background: true });
        } catch (e) {
            setCreateMsg({ type: 'error', text: e.message });
        } finally {
            setCreating(false);
        }
    };

    const handleAction = async (id, action) => {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        try {
            if (action === 'stop') await api.databases.stop(id);
            if (action === 'start') await api.databases.start(id);
            if (action === 'destroy') {
                if (destroyConfirmText !== 'DELETE') return;
                await api.databases.destroy(id);
                setShowConfirmDestroy(null);
                setDestroyConfirmText('');
            }
            loadData({ background: true });
        } catch (e) {
            setError(e.message);
            setTimeout(() => setError(''), 5000);
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: false }));
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
            case 'provisioning': return 'bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse';
            case 'stopped': return 'bg-slate-500/20 text-slate-400 border-slate-500/20';
            case 'error': case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/20';
            default: return 'bg-slate-800 text-slate-500 border-white/5';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Managed Databases</h2>
                <div className="flex gap-4">
                    <div className="text-sm font-semibold text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                        <Database size={14} className="text-emerald-400" />
                        <span className="text-white">{databases.length}</span>
                        <span className="text-slate-500">instances</span>
                    </div>
                </div>
            </div>

            {/* Create Database Card */}
            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database size={120} />
                </div>

                <div className="relative z-10">
                    <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2 uppercase italic">
                        <Plus size={20} className="text-emerald-500" />
                        Provision New Instance
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">Database Name</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-white/10"
                                    placeholder="e.g. production-clusters"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">Select Instance Plan</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {plans.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-1 group ${selectedPlan === plan.id
                                                    ? 'bg-emerald-500/10 border-emerald-500 ring-4 ring-emerald-500/10'
                                                    : 'bg-black/40 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlan === plan.id ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {plan.name.replace('DB ', '')}
                                            </span>
                                            <span className="text-lg font-black text-white">₹{(plan.price_per_hour / 100).toFixed(2)}<span className="text-[10px] text-slate-500">/hr</span></span>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                                    <Cpu size={10} /> {plan.cpu} vCPU
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                                    <Activity size={10} /> {plan.memory} RAM
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400">
                                                    <HardDrive size={10} /> {plan.storage} Storage
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                            {newDbDetails ? (
                                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h4 className="text-white font-black uppercase tracking-widest text-sm">Instance Provisioned</h4>
                                    <p className="text-slate-400 text-xs px-4">Your database is ready. Copy these credentials now. They will only be shown once.</p>

                                    <div className="space-y-2 text-left w-full">
                                        <div className="bg-black/60 p-3 rounded-xl border border-white/5 group relative overflow-hidden">
                                            <label className="block text-[8px] font-black text-slate-600 uppercase mb-1">Public Endpoint</label>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-emerald-300 truncate mr-2">{newDbDetails.url}</span>
                                                <button onClick={() => copyToClipboard(newDbDetails.url, 'new-url')} className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-400">
                                                    {copiedId === 'new-url' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setNewDbDetails(null)} className="text-xs font-black text-slate-500 uppercase hover:text-white transition-colors">Dismiss</button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white/5 text-slate-500 rounded-full flex items-center justify-center mb-2">
                                        <Server size={24} />
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium max-w-[240px]">
                                        Every database is isolated in its own K8s pod with dedicated CPU, RAM, and Persistent Storage.
                                    </p>
                                    <button
                                        onClick={handleCreate}
                                        disabled={creating || !name.trim()}
                                        className="w-full max-w-[200px] bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
                                    >
                                        {creating ? <RefreshCw size={14} className="animate-spin" /> : <><Plus size={16} className="group-hover:rotate-90 transition-transform" /> Deploy Now</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {createMsg && (
                <div className={`p-4 rounded-2xl mb-6 font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${createMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {createMsg.type === 'success' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                    {createMsg.text}
                </div>
            )}

            {/* Database Listing Table */}
            <div className="bg-[#0b0f1a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Instance Details</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Resources</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage & Billing</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {databases.map(db => (
                                <tr key={db.id} className="group hover:bg-white/[0.01] transition-all border-l-4 border-transparent hover:border-emerald-500/40">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${db.status === 'running' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'
                                                }`}>
                                                <HardDrive size={24} className={db.status === 'running' ? 'animate-pulse' : ''} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-black text-base">{db.name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Plan: <span className="text-slate-300">{db.plan_id.replace('db-', '').toUpperCase()}</span></span>
                                                    <span className="text-slate-700 font-black text-[8px]">•</span>
                                                    <span className="text-[10px] font-mono text-slate-500">{db.db_host}:{db.db_port}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(db.status)}`}>
                                            {db.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="w-[120px] space-y-2">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                                                    <span>CPU</span>
                                                    <span className="text-slate-300">{db.metrics?.cpu && db.metrics.cpu !== '0' ? db.metrics.cpu : 'Idle'}</span>
                                                </div>
                                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: db.metrics?.cpu && db.metrics.cpu !== '0' ? '40%' : '5%' }} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                                                    <span>RAM</span>
                                                    <span className="text-slate-300">{db.metrics?.memory && db.metrics.memory !== '0' ? db.metrics.memory : 'Idle'}</span>
                                                </div>
                                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-purple-500 h-full rounded-full" style={{ width: db.metrics?.memory && db.metrics.memory !== '0' ? '60%' : '5%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-white font-bold text-sm">₹{(db.hourly_rate / 100).toFixed(2)}</span>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">/ hr</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-slate-500 font-bold text-[10px]">
                                                <HardDrive size={12} className="text-emerald-500/40" />
                                                <span>{db.storage || '1Gi'} Allocated</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 opacity-100 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => copyToClipboard(db.url, db.id)}
                                                className="p-3 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-2xl transition-all border border-transparent hover:border-emerald-500/20"
                                                title="Copy Connection URL"
                                            >
                                                {copiedId === db.id ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                            </button>

                                            {db.status === 'stopped' ? (
                                                <button
                                                    onClick={() => handleAction(db.id, 'start')}
                                                    disabled={actionLoading[db.id]}
                                                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl transition-all border border-emerald-500/20"
                                                    title="Start DB"
                                                >
                                                    {actionLoading[db.id] ? <RefreshCw size={18} className="animate-spin" /> : <Power size={18} />}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAction(db.id, 'stop')}
                                                    disabled={actionLoading[db.id] || db.status === 'provisioning'}
                                                    className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl transition-all border border-amber-500/20 disabled:opacity-30"
                                                    title="Stop DB (Preserves PVC)"
                                                >
                                                    {actionLoading[db.id] ? <RefreshCw size={18} className="animate-spin" /> : <Power size={18} />}
                                                </button>
                                            )}

                                            <button
                                                onClick={() => setShowConfirmDestroy(db)}
                                                disabled={actionLoading[db.id]}
                                                className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all border border-red-500/20"
                                                title="Destroy Database (Permanent)"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {databases.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="w-16 h-16 bg-white/5 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Database size={32} />
                                        </div>
                                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-1">No Instances Active</h4>
                                        <p className="text-slate-500 text-xs font-medium italic">Provision your first high-performance SQL cluster above.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Destroy Confirmation Modal */}
            {showConfirmDestroy && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0b0f1a] border border-red-500/30 rounded-[2.5rem] max-w-md w-full p-10 shadow-3xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tight">Destroy Database</h3>
                        <p className="text-slate-400 text-center text-xs font-medium mb-8 leading-relaxed">
                            Warning: This will permanently delete the namespace and the <span className="text-red-400 font-bold">1Gi PVC storage</span>. This action is irreversible. All data will be lost.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest text-center">Type <span className="text-white">DELETE</span> to confirm</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-white focus:outline-none focus:border-red-500 transition-all font-black uppercase placeholder:text-white/5"
                                    placeholder="Required"
                                    value={destroyConfirmText}
                                    onChange={e => setDestroyConfirmText(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => { setShowConfirmDestroy(null); setDestroyConfirmText(''); }}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(showConfirmDestroy.id, 'destroy')}
                                    disabled={destroyConfirmText !== 'DELETE'}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase hover:bg-red-500 disabled:opacity-20 transition-all shadow-xl shadow-red-600/20"
                                >
                                    Destroy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">Persistent Hard Disks</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                            Unlike app pods, database pods use PVCs (Persistent Volume Claims). If a pod crashes or you "Stop" it, your data remains safely stored on the server's disk.
                        </p>
                    </div>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-sm uppercase tracking-widest mb-1">Public TCP Access</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-bold italic">
                            Each database gets a dedicated NodePort on wrexer.com. You can connect from your local terminal or any external application using the provided connection string.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
