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
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Billing Dashboard</h1>
                    <p className="text-slate-500">Real-time resource usage and credit management.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm font-medium">
                    <AlertCircle size={16} />
                    Auto-deletion active: Pods stop when balance hit ₹0
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Zap size={80} className="text-slate-300" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Available balance</h2>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-extrabold text-slate-900">₹{balance}</span>
                            <span className="text-slate-400 text-sm font-medium">INR</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status Report</div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${balance > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                Account {balance > 0 ? 'Active & Healthy' : 'Action Required'}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Usage Card (The Gap Filler) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Box size={14} className="text-indigo-500" />
                            Live Consumption
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{appsCount}</div>
                                <div className="text-[10px] text-slate-400 font-medium">Active Pods</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">₹{hourlyCost}</div>
                                <div className="text-[10px] text-slate-400 font-medium">Cost / Hour</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold mb-0.5 tracking-wider">ONGOING CREDIT</div>
                            <div className="text-sm font-black text-indigo-600 font-mono">
                                CREDIT = ₹{balance}
                            </div>
                        </div>
                        <div className="flex -space-x-1 opacity-50">
                            {[...Array(Math.min(appsCount, 3))].map((_, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                    <Box size={8} className="text-slate-400" />
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
                    className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-inner"
                >
                    <h2 className="text-slate-900 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard size={14} className="text-blue-600" />
                        Quick Recharge
                    </h2>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {AMOUNTS.map(amt => (
                            <button
                                key={amt}
                                onClick={() => setSelectedAmount(amt)}
                                className={`py-2 px-3 rounded-xl text-sm font-bold transition-all border-2 ${selectedAmount === amt
                                    ? 'bg-white border-blue-600 text-blue-600 shadow-sm'
                                    : 'bg-white/50 border-transparent text-slate-500 hover:border-slate-200'
                                    }`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleTopUp}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Recharge Now'}
                        <ArrowRight size={16} />
                    </button>
                </motion.div>
            </div>

            {/* Transaction History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-12 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <History className="text-slate-400" size={24} />
                        Billing History
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-8 py-4">Transaction</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Amount</th>
                                <th className="px-8 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-slate-400 italic">
                                        Loading history...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-slate-400 italic">
                                        No recent transactions.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="font-medium text-slate-900">
                                                {tx.type === 'topup' ? 'Credit Top Up' : (tx.type === '5min_cycle_charge' ? `Resource Usage (${tx.external_id || 'Pod'})` : tx.type)}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">{tx.id}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tx.status === 'success'
                                                ? 'bg-green-50 text-green-600'
                                                : (tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')
                                                }`}>
                                                {tx.status === 'success' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className={`px-8 py-4 font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                            {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                                        </td>
                                        <td className="px-8 py-4 text-slate-500 text-sm">
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

