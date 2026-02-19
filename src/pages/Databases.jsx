import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Database, Plus, Trash2, Copy, CheckCircle2, RefreshCw, AlertCircle, HardDrive, Server } from 'lucide-react';

export default function Databases() {
    const [databases, setDatabases] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState({});
    const [createMsg, setCreateMsg] = useState(null);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [newDbDetails, setNewDbDetails] = useState(null);

    const loadDatabases = async (opts = { background: false }) => {
        try {
            if (!opts.background) setLoading(true);
            const data = await api.databases.list();
            setDatabases(data);
        } catch (e) {
            setError(e.message);
        } finally {
            if (!opts.background) setLoading(false);
        }
    };

    useEffect(() => {
        loadDatabases();
        const iv = setInterval(() => loadDatabases({ background: true }), 10000);
        return () => clearInterval(iv);
    }, []);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setCreating(true);
        setCreateMsg(null);
        setNewDbDetails(null);
        try {
            const data = await api.databases.create(name.trim());
            setCreateMsg({ type: 'success', text: `Database "${data.database}" created successfully!` });
            setNewDbDetails(data);
            setName('');
            await loadDatabases({ background: true });
        } catch (e) {
            setCreateMsg({ type: 'error', text: e.message });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(`Delete database "${id}"? This is irreversible!`)) return;
        setDeleting(d => ({ ...d, [id]: true }));
        try {
            await api.databases.delete(id);
            await loadDatabases({ background: true });
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

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black text-white tracking-tight">Managed Databases</h2>
                <div className="text-sm font-semibold text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                    <Database size={14} className="text-emerald-400" />
                    <span className="text-white">{databases.length}</span>
                    <span className="text-slate-500">database{databases.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Create Database Form */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                className="bg-white/5 p-8 rounded-3xl border border-white/5 mb-10"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black tracking-tight">Create New Database</h3>
                </div>

                {createMsg && (
                    <div className={`p-4 rounded-xl mb-6 font-medium ${createMsg.type === 'success'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {createMsg.text}
                    </div>
                )}

                {/* Show connection details after creation */}
                {newDbDetails && (
                    <div className="p-5 rounded-2xl mb-6 bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 size={14} />
                            Connection Details — Save these now!
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-[11px] text-emerald-300 bg-black/30 rounded-lg px-3 py-2 font-mono break-all">
                                    {newDbDetails.connectionString}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(newDbDetails.connectionString, 'new-conn')}
                                    className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all shrink-0"
                                >
                                    {copiedId === 'new-conn' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                                <div className="bg-black/20 rounded-lg px-3 py-2">
                                    <span className="text-slate-500 font-bold uppercase">Host</span>
                                    <div className="text-white font-mono mt-0.5">{newDbDetails.host}</div>
                                </div>
                                <div className="bg-black/20 rounded-lg px-3 py-2">
                                    <span className="text-slate-500 font-bold uppercase">Port</span>
                                    <div className="text-white font-mono mt-0.5">{newDbDetails.port}</div>
                                </div>
                                <div className="bg-black/20 rounded-lg px-3 py-2">
                                    <span className="text-slate-500 font-bold uppercase">Database</span>
                                    <div className="text-white font-mono mt-0.5">{newDbDetails.database}</div>
                                </div>
                                <div className="bg-black/20 rounded-lg px-3 py-2">
                                    <span className="text-slate-500 font-bold uppercase">User</span>
                                    <div className="text-white font-mono mt-0.5">{newDbDetails.username}</div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-amber-400/60 font-medium">
                            ⚠ The password is only shown once in the connection string. Store it securely.
                        </p>
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Database Name</label>
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                            placeholder="e.g. my-app-db"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={creating || !name.trim()}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-500 disabled:opacity-50 font-black transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs flex items-center gap-2"
                        >
                            {creating ? (
                                <><RefreshCw size={14} className="animate-spin" /> Creating...</>
                            ) : (
                                <><Plus size={14} /> Create Database</>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <Server size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-blue-300/70 leading-relaxed font-medium">
                        <span className="text-blue-400 font-bold">Managed PostgreSQL:</span> Each database gets an isolated user with full privileges. Use the connection string in your app's environment variables.
                    </p>
                </div>
            </form>

            {/* Database List */}
            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-6 font-medium">{error}</div>}

            {loading && !databases.length && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin text-emerald-500 mb-4"><RefreshCw size={32} /></div>
                    <div className="text-slate-500 font-medium italic tracking-wide">Loading databases...</div>
                </div>
            )}

            {!loading && databases.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <div className="inline-flex p-4 rounded-full bg-slate-800 text-slate-500 mb-4">
                        <Database size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Databases Yet</h3>
                    <p className="text-slate-400">Create your first managed PostgreSQL database above.</p>
                </div>
            )}

            {databases.length > 0 && (
                <div className="bg-[#0f172a] shadow-sm rounded-2xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Database</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Storage</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Quota</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#0f172a]">
                                {databases.map(db => {
                                    const quotaPercent = parseFloat(db.usagePercent) || 0;
                                    const barColor = db.isOverQuota
                                        ? 'bg-red-500'
                                        : quotaPercent > 75
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500';

                                    return (
                                        <tr key={db.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                                                        <HardDrive className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white leading-tight mb-0.5 text-sm">{db.database}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">PostgreSQL 16</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-white">{db.size}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="min-w-[140px]">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Usage</span>
                                                        <span className="text-[10px] font-mono font-bold text-slate-300">
                                                            {db.usagePercent} <span className="text-slate-600">/ {db.quotaLimit}</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                                                        <div className={`${barColor} h-full rounded-full relative`} style={{ width: `${Math.min(quotaPercent, 100)}%` }}>
                                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                                        </div>
                                                    </div>
                                                    {db.isOverQuota && (
                                                        <div className="flex items-center gap-1 mt-1 text-[9px] text-red-400 font-bold">
                                                            <AlertCircle size={10} /> Over quota
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(db.id)}
                                                        disabled={!!deleting[db.id]}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                                        title="Delete Database"
                                                    >
                                                        {deleting[db.id] ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
        </div>
    );
}
