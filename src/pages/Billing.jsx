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

export default function Billing() {
    const [balance, setBalance] = useState(0);
    const [selectedAmount, setSelectedAmount] = useState(100);
    const [transactions, setTransactions] = useState([]);
    const [appsCount, setAppsCount] = useState(0);
    const [hourlyCost, setHourlyCost] = useState(0);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const [balRes, transRes, appsRes] = await Promise.all([
                apiFetch('/billing/balance'),
                apiFetch('/billing/transactions'),
                apiFetch('/apps')
            ]);
            setBalance(balRes.balance);
            setTransactions(transRes);
            setAppsCount(appsRes.length);

            // Calculate hourly cost (mock logic or based on plan if available in appsRes)
            // For now, we know Small=10, Medium=50, Large=100.
            // Assuming apps have planId.
            const cost = appsRes.reduce((acc, app) => {
                if (app.plan_id === 'p-tiny') return acc + 0;
                if (app.plan_id === 'p-small') return acc + 0.25;
                if (app.plan_id === 'p-medium') return acc + 0.5;
                if (app.plan_id === 'p-large') return acc + 1.0;
                return acc + 0.25;
            }, 0);
            setHourlyCost(cost);
        } catch (err) {
            console.error(err);
            setError('Failed to load billing data');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Live polling every 30s to show deductions/topups live
        const interval = setInterval(fetchData, 30000);

        // Check for success status from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('topup') === 'success') {
            alert('Payment Successful! Credits added.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        return () => clearInterval(interval);
    }, []);

    const handleTopUp = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/billing/initiate-payment', {
                method: 'POST',
                body: JSON.stringify({ amount: selectedAmount })
            });
            // Redirect to PhonePe (Mocked)
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
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Pods</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black text-white mb-1">₹{hourlyCost}</div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Cost / Hour</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-slate-500 font-black mb-1 tracking-widest uppercase">Project Burn</div>
                            <div className="text-sm font-black text-indigo-400 font-mono">
                                CREDIT = ₹{balance}
                            </div>
                        </div>
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(appsCount, 4))].map((_, i) => (
                                <div key={i} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <Box size={10} className="text-slate-400" />
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
                                                {tx.type === 'topup' ? 'Credit Injection' : (tx.type === '5min_cycle_charge' ? `Resource Consumption (${tx.external_id || 'Pod'})` : tx.type)}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{tx.id}</div>
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
                                        <td className={`px-10 py-6 text-right font-black text-lg ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                                            {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
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
        </div>
    );
}

