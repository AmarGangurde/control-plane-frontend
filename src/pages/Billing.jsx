import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    History,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    Zap,
    Box,
    ArrowRight
} from 'lucide-react';

const AMOUNTS = [50, 100, 200, 500];

const formatDuration = (seconds) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

export default function Billing() {
    const [balance, setBalance] = useState(0);
    const [reservedBalance, setReservedBalance] = useState(0);
    const [liveReserved, setLiveReserved] = useState(0);
    const [selectedAmount, setSelectedAmount] = useState(100);
    const [transactions, setTransactions] = useState([]);
    const [appsCount, setAppsCount] = useState(0);
    const [hourlyCost, setHourlyCost] = useState(0);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const fetchData = async () => {
        try {
            const [balRes, transRes, appsRes] = await Promise.all([
                apiFetch('/billing/balance'),
                apiFetch('/billing/transactions'),
                apiFetch('/apps')
            ]);
            setBalance(balRes.balance / 100);
            setReservedBalance(balRes.reserved_balance / 100);
            setLiveReserved(balRes.reserved_balance / 100);
            setTransactions(transRes.map(tx => ({ ...tx, amount: tx.amount / 100 })));

            const activeApps = appsRes.filter(a => a.status === 'running');
            setAppsCount(activeApps.length);

            // Calculate hourly cost based on active apps' hourly_rate (converted to INR)
            const cost = activeApps.reduce((acc, app) => acc + (app.hourly_rate || 0), 0);
            setHourlyCost(cost / 100);
        } catch (err) {
            console.error(err);
            setError('Failed to load billing data');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Sync with server every 30s
        const interval = setInterval(fetchData, 30000);

        // Check for success status from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('topup') === 'success') {
            setShowSuccess(true);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (params.get('status') === 'processing') {
            setStatusMessage('Verifying payment with PhonePe...');
            setTimeout(() => setStatusMessage(null), 5000);
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return () => clearInterval(interval);
    }, []);

    // Per-second "Live Drain" Effect
    useEffect(() => {
        if (hourlyCost <= 0) return;

        const tick = setInterval(() => {
            const drainPerSecond = hourlyCost / 3600;
            setLiveReserved(prev => Math.max(0, prev - drainPerSecond));
        }, 1000);

        return () => clearInterval(tick);
    }, [hourlyCost]);

    const handleTopUp = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/billing/initiate-payment', {
                method: 'POST',
                body: JSON.stringify({ amount: selectedAmount })
            });
            // Redirect to PhonePe Standard Checkout
            window.location.href = res.url;
        } catch (err) {
            setError(err.message || 'Failed to initiate payment');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-10 px-6">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Billing Dashboard</h1>
                    <p className="text-slate-400 text-lg font-medium">Real-time resource usage and credit management.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm font-bold uppercase tracking-wide">
                    <AlertCircle size={18} />
                    Auto-deletion active
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap size={100} className="text-blue-500" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Available balance</h2>
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-5xl font-black text-white">₹{balance.toLocaleString()}</span>
                            <span className="text-slate-500 text-sm font-bold tracking-widest uppercase">INR</span>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">System Status</div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${balance > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                Account {balance > 0 ? 'Verified & Active' : 'Credit Required'}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Usage Card (The Gap Filler) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col justify-between"
                >
                    <div>
                        <h2 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Box size={16} />
                            Live Consumption
                        </h2>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-3xl font-black text-white mb-1">{appsCount}</div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Active Pods</div>

                                <div className="text-xl font-black text-indigo-400 mb-0.5">₹{liveReserved.toFixed(4)}</div>
                                <div className="text-[10px] text-indigo-400/50 font-black uppercase tracking-widest">Reserve Money</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-white mb-1">₹{hourlyCost.toFixed(2)}</div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Cost / Hour</div>

                                <div className="text-xl font-black text-indigo-400 mb-0.5">₹{(hourlyCost / 60).toFixed(4)}</div>
                                <div className="text-[10px] text-indigo-400/50 font-black uppercase tracking-widest">Cost / Minute</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-slate-500 font-black mb-1 tracking-widest uppercase">Project Burn</div>
                            <div className="text-sm font-black text-indigo-400 font-mono">
                                RE-WALLET = ₹{reservedBalance.toFixed(2)}
                            </div>
                        </div>
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(appsCount, 4))].map((_, i) => (
                                <div key={i} className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center backdrop-blur-sm">
                                    <Box size={10} className="text-indigo-400" />
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Top Up Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 rounded-[2rem] p-8 border border-white/5 shadow-2xl overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-blue-600/5 -z-10" />
                    <h2 className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <CreditCard size={16} />
                        Quick Recharge
                    </h2>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {AMOUNTS.map(amt => (
                            <button
                                key={amt}
                                onClick={() => setSelectedAmount(amt)}
                                className={`py-3 px-4 rounded-2xl text-sm font-black transition-all border-2 ${selectedAmount === amt
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                                    }`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleTopUp}
                        disabled={loading}
                        className="w-full bg-white text-slate-950 hover:bg-slate-200 font-black py-4 rounded-2xl transition-all shadow-2xl shadow-white/5 flex items-center justify-center gap-3 text-sm disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Complete Top-up'}
                        <ArrowRight size={18} />
                    </button>
                </motion.div>
            </div>

            {/* Transaction History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-16 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden"
            >
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white font-black text-xl tracking-tight">
                        <History className="text-slate-500" size={24} />
                        Transaction History
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-10 py-5">Transaction Details</th>
                                <th className="px-10 py-5">Status</th>
                                <th className="px-10 py-5 text-right">Amount</th>
                                <th className="px-10 py-5">Execution Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {historyLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-10 py-20 text-center text-slate-500 italic font-medium">
                                        Synchronizing history...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-10 py-20 text-center text-slate-500 italic font-medium">
                                        No recent activity detected.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                {tx.type === 'topup' ? 'Credit Injection' :
                                                    tx.type === 'reservation' ? 'Pod Start Reservation' :
                                                        tx.type === 'refund' ? 'Reservation Refund' :
                                                            tx.type === 'pod_burn_receipt' ? `Usage Receipt: ${tx.external_id || 'Pod'}` :
                                                                tx.type}
                                            </div>
                                            {tx.type === 'pod_burn_receipt' ? (
                                                <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase flex items-center gap-2">
                                                    <span>Non-deductible Summary</span>
                                                    {tx.metadata && (() => {
                                                        try {
                                                            const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
                                                            if (meta.duration) {
                                                                return (
                                                                    <>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-500/50" />
                                                                        <span>{formatDuration(meta.duration)}</span>
                                                                    </>
                                                                );
                                                            }
                                                        } catch (e) { }
                                                        return null;
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                                                    {tx.id}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${tx.status === 'success'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : (tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20')
                                                }`}>
                                                {tx.status === 'success' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className={`px-10 py-6 text-right font-black text-lg ${tx.type === 'pod_burn_receipt' ? 'text-slate-500' :
                                            tx.amount > 0 ? 'text-green-400' : 'text-white'
                                            }`}>
                                            {tx.type === 'pod_burn_receipt'
                                                ? `₹${Math.abs(tx.amount).toFixed(2)}`
                                                : (tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`)}
                                        </td>
                                        <td className="px-10 py-6 text-slate-400 text-xs font-medium">
                                            {new Date(tx.created_at + 'Z').toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Status Toast */}
            <AnimatePresence>
                {statusMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-4 z-50 border border-white/20"
                    >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {statusMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
                            <div className="bg-green-100 text-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Top-up Successful!</h2>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                                Your credits have been synchronized. You can now continue deploying high-performance pods.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Back to Dashboard
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

