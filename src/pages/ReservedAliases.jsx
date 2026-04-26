import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link, Plus, Trash2, RefreshCw, CheckCircle,
    XCircle, ExternalLink, Loader, AlertCircle, Zap, ChevronDown
} from 'lucide-react';

const PRICE_INR = 29;
const ALIAS_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const BLOCKLIST = new Set([
    'www', 'api', 'admin', 'mail', 'dashboard', 'billing', 'app',
    'wrexer', 'support', 'dev', 'staging', 'ns', 'ftp', 'smtp',
    'cdn', 'static', 'assets', 'auth', 'login', 'signup', 'register',
]);

function validateSlug(slug) {
    if (!slug || slug.length < 3) return null;
    if (!ALIAS_REGEX.test(slug)) return 'Use 3–30 lowercase letters, numbers, and hyphens.';
    if (BLOCKLIST.has(slug)) return `"${slug}" is reserved.`;
    return null;
}

// Clean custom app picker dropdown
function AppPicker({ apps, value, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = apps.find(a => a.id === value);

    return (
        <div className="relative flex-1">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-left hover:border-white/20 transition-all focus:outline-none focus:border-violet-500/50"
            >
                {selected ? (
                    <span className="text-white truncate">{selected.name}</span>
                ) : (
                    <span className="text-slate-500">No app — unassigned</span>
                )}
                <ChevronDown size={13} className={`text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 top-full mt-1 w-full bg-[#0b1121] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* None option */}
                        <button
                            type="button"
                            onClick={() => { onChange(''); setOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${!value ? 'text-violet-400 font-bold' : 'text-slate-500 font-medium'}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!value ? 'bg-violet-400' : 'bg-transparent'}`} />
                            No app (unassigned)
                        </button>
                        <div className="border-t border-white/5" />
                        {apps.map(a => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => { onChange(a.id); setOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-white/5 transition-colors ${value === a.id ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${value === a.id ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                                {a.name}
                                <span className="ml-auto text-[9px] text-slate-600 uppercase font-bold tracking-wider">
                                    {a.status}
                                </span>
                            </button>
                        ))}
                        {apps.length === 0 && (
                            <div className="px-3 py-3 text-xs text-slate-600 font-medium text-center">No apps yet</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ReservedAliases() {
    const { fmt } = useCurrency();
    const [aliases, setAliases] = useState([]);
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [slug, setSlug] = useState('');
    const [slugStatus, setSlugStatus] = useState(null);
    const [reserving, setReserving] = useState(false);
    const [reserveMsg, setReserveMsg] = useState(null);

    const [selectedApp, setSelectedApp] = useState({});
    const [assigning, setAssigning] = useState({});
    const [releaseConfirm, setReleaseConfirm] = useState(null);

    const load = useCallback(async () => {
        try {
            const [aliasRes, appRes] = await Promise.all([
                api.reservedAliases.list(),
                api.apps.list(),
            ]);
            setAliases(aliasRes);
            setApps(appRes.filter(a => (a.type === 'app' || a.type === 'service') && a.status !== 'deleted'));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const s = slug.trim();
        if (!s || s.length < 3) { setSlugStatus(null); return; }
        const err = validateSlug(s);
        if (err) { setSlugStatus({ available: false, reason: err }); return; }
        setSlugStatus({ checking: true });
        const timer = setTimeout(async () => {
            try {
                const res = await api.apps.checkAlias(s);
                setSlugStatus(res);
            } catch {
                setSlugStatus({ available: false, reason: 'Could not check availability.' });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [slug]);

    const handleReserve = async () => {
        const s = slug.trim();
        if (!slugStatus?.available) return;
        setReserving(true);
        setReserveMsg(null);
        try {
            await api.reservedAliases.reserve(s);
            setSlug('');
            setSlugStatus(null);
            setReserveMsg({ type: 'success', text: `✓ "${s}.wrexer.com" is now yours!` });
            await load();
        } catch (e) {
            setReserveMsg({ type: 'error', text: e.message });
        } finally {
            setReserving(false);
        }
    };

    const handleAssign = async (ra) => {
        const chosenAppId = selectedApp[ra.id] !== undefined ? selectedApp[ra.id] : (ra.assigned_app_id || '');
        setAssigning(s => ({ ...s, [ra.id]: true }));
        try {
            if (!chosenAppId) {
                await api.reservedAliases.unassign(ra.id);
            } else {
                await api.reservedAliases.assign(ra.id, chosenAppId);
            }
            setSelectedApp(s => { const n = { ...s }; delete n[ra.id]; return n; });
            await load();
        } catch (e) {
            alert(e.message);
        } finally {
            setAssigning(s => ({ ...s, [ra.id]: false }));
        }
    };

    const handleRelease = async (id) => {
        try {
            await api.reservedAliases.release(id);
            setReleaseConfirm(null);
            await load();
        } catch (e) {
            alert(e.message);
        }
    };

    const daysLeft = (expiresAt) => {
        const diff = new Date(expiresAt) - Date.now();
        return Math.max(0, Math.ceil(diff / 86400000));
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto py-20 text-center text-red-400 font-medium">{error}</div>
    );

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">Reserved Aliases</h1>
                <p className="text-slate-400 text-base font-medium">
                    Own a permanent <span className="text-violet-400 font-bold">slug.wrexer.com</span> URL — survives pod deletion. {fmt(PRICE_INR)}/month per alias.
                </p>
            </header>

            {/* Reserve card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-violet-600/10 to-purple-900/5 border border-violet-500/20 rounded-[2rem] p-8 mb-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Zap size={100} className="text-violet-400" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Link size={16} className="text-violet-400" />
                        <h2 className="text-violet-400 text-xs font-black uppercase tracking-[0.2em]">Reserve a New Alias</h2>
                    </div>
                    <div className="flex items-stretch gap-3 mb-3">
                        <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/50 transition-all">
                            <input
                                className="flex-1 bg-transparent px-4 py-3.5 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600"
                                placeholder="my-app"
                                value={slug}
                                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && handleReserve()}
                            />
                            <span className="px-4 text-slate-500 font-mono text-sm shrink-0">.wrexer.com</span>
                            <div className="flex items-center justify-center w-10 mr-2">
                                {slugStatus?.checking && <Loader size={16} className="text-slate-500 animate-spin" />}
                                {!slugStatus?.checking && slugStatus?.available === true && <CheckCircle size={16} className="text-emerald-400" />}
                                {!slugStatus?.checking && slugStatus?.available === false && <XCircle size={16} className="text-red-400" />}
                            </div>
                        </div>
                        <button
                            onClick={handleReserve}
                            disabled={reserving || !slugStatus?.available}
                            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                            {reserving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                            Reserve — {fmt(PRICE_INR)}/mo
                        </button>
                    </div>
                    {slugStatus && !slugStatus.checking && (
                        <p className={`text-[11px] font-semibold px-1 mb-1 ${slugStatus.available ? 'text-emerald-400' : 'text-red-400'}`}>
                            {slugStatus.available ? '✓ Available!' : `✗ ${slugStatus.reason || 'Already taken'}`}
                        </p>
                    )}
                    {reserveMsg && (
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold mt-3 ${reserveMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {reserveMsg.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                            {reserveMsg.text}
                        </div>
                    )}
                    <p className="text-[10px] text-slate-600 font-medium mt-3 px-1">
                        First month charged immediately · Auto-renews monthly · No refunds on cancellation
                    </p>
                </div>
            </motion.div>

            {/* List */}
            {aliases.length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-medium">
                    No reserved aliases yet. Reserve your first one above!
                </div>
            ) : (
                <div className="space-y-3">
                    {aliases.map((ra, i) => {
                        const days = daysLeft(ra.expires_at);
                        const isExpired = ra.status === 'expired';
                        const assignedApp = apps.find(a => a.id === ra.assigned_app_id);
                        const pickVal = selectedApp[ra.id] !== undefined ? selectedApp[ra.id] : (ra.assigned_app_id || '');

                        return (
                            <motion.div
                                key={ra.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`bg-white/[0.03] border rounded-2xl ${isExpired ? 'border-red-500/20 opacity-60' : 'border-white/[0.08]'}`}
                            >
                                {/* Info row */}
                                <div className="px-5 py-4 flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white font-mono font-bold text-sm">
                                                {ra.slug}<span className="text-slate-600">.wrexer.com</span>
                                            </span>
                                            {!isExpired && (
                                                <a href={`https://${ra.slug}.wrexer.com`} target="_blank" rel="noreferrer"
                                                    className="text-slate-700 hover:text-violet-400 transition-colors">
                                                    <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-500 font-medium">
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${isExpired ? 'text-red-400 bg-red-500/10' : days <= 5 ? 'text-amber-400 bg-amber-500/10' : 'text-violet-400 bg-violet-500/10'
                                                }`}>
                                                {isExpired ? 'Expired' : `${days}d left`}
                                            </span>
                                            {assignedApp
                                                ? <span className="text-emerald-400">→ {assignedApp.name}</span>
                                                : <span className="text-slate-700">Unassigned</span>}
                                            <span className="text-slate-700">· {fmt(ra.price_per_month / 100)}/mo · renews {new Date(ra.expires_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setReleaseConfirm(ra.id)}
                                        className="p-1.5 text-slate-700 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 shrink-0"
                                        title="Release (no refund)"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* Assign row */}
                                {!isExpired && (
                                    <div className="border-t border-white/[0.05] px-5 py-3 flex items-center gap-2 bg-black/10 rounded-b-2xl relative">
                                        <AppPicker
                                            apps={apps}
                                            value={pickVal}
                                            onChange={val => setSelectedApp(s => ({ ...s, [ra.id]: val }))}
                                        />
                                        <button
                                            onClick={() => handleAssign(ra)}
                                            disabled={assigning[ra.id]}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0"
                                        >
                                            {assigning[ra.id] && <RefreshCw size={10} className="animate-spin" />}
                                            Assign
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Release confirm modal */}
            <AnimatePresence>
                {releaseConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                        onClick={() => setReleaseConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0b1121] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                                <Trash2 size={24} className="text-red-400" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">Release Alias?</h3>
                            <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
                                This alias will be freed immediately. <span className="text-amber-400">No refund</span> is given for the remaining period.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setReleaseConfirm(null)}
                                    className="flex-1 py-3 rounded-2xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all">
                                    Cancel
                                </button>
                                <button onClick={() => handleRelease(releaseConfirm)}
                                    className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-500 transition-all">
                                    Release
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
