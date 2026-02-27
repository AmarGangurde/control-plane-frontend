import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
    Wallet, CreditCard, History, Zap, ArrowUpRight,
    ArrowDownRight, RefreshCw, Info, CheckCircle2,
    XCircle, Sparkles, TrendingUp, Clock, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Billing() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('500');
    const [payLoading, setPayLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [balData, txData] = await Promise.all([
                api.billing.balance(),
                api.billing.transactions()
            ]);
            setBalance(balData.balance);
            setTransactions(txData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Check for redirect return
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('order_id');
        if (orderId) {
            setStatusMsg({ type: 'loading', text: 'Validating Transaction Hash...' });
            api.billing.verifyReturn(orderId).then(res => {
                if (res.status === 'SUCCESS') {
                    setStatusMsg({ type: 'success', text: `Credits Allocated! Ref ID: ${orderId}` });
                    loadData();
                } else {
                    setStatusMsg({ type: 'error', text: `Transaction Nullified: ${res.status}` });
                }
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }).catch(e => {
                setStatusMsg({ type: 'error', text: e.message });
            });
        }
    }, []);

    const handleTopUp = async () => {
        setPayLoading(true);
        try {
            const { payment_session_id } = await api.billing.initiatePayment(parseInt(topUpAmount));
            // Redirect to Cashfree checkout (mock or real)
            const checkoutUrl = `https://payments.cashfree.com/pay/${payment_session_id}`;
            window.location.href = checkoutUrl;
        } catch (e) {
            alert(e.message);
            setPayLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
                        <Wallet className="text-blue-500" size={36} /> Capital Reserve
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 ml-1">Real-time resource credit management</p>
                </div>
                <div className="flex items-center gap-4 glass px-6 py-3 rounded-2xl border-white/5 bg-white/[0.02]">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Burn: <span className="text-white">₹42.00 /day</span></span>
                </div>
            </div>

            <AnimatePresence>
                {statusMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-6 rounded-[2rem] border flex items-center gap-4 font-bold text-xs uppercase tracking-widest ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                statusMsg.type === 'loading' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                    >
                        {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> :
                            statusMsg.type === 'loading' ? <RefreshCw size={18} className="animate-spin" /> :
                                <XCircle size={18} />}
                        {statusMsg.text}
                        <button onClick={() => setStatusMsg(null)} className="ml-auto text-slate-500 hover:text-white transition-colors">
                            <XCircle size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="glass p-12 rounded-[4rem] border border-white/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Sparkles size={160} className="text-blue-500" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Total Credits Allocated</h3>
                            <div className="flex items-baseline gap-4 mb-2">
                                <span className="text-7xl font-black text-white tracking-tighter italic">₹{(balance / 100).toFixed(2)}</span>
                                <span className="text-xl font-black text-blue-500 uppercase tracking-widest">INR</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-xs leading-relaxed italic">
                                Credits are consumed per millisecond based on compute cluster runtime and storage allocation.
                            </p>
                        </div>
                    </motion.div>

                    <div className="glass rounded-[3rem] border border-white/5 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <History size={16} className="text-slate-500" /> Ledger Protocol
                            </h3>
                            <div className="px-4 py-1.5 glass rounded-full text-[8px] font-black text-slate-500 uppercase tracking-widest italic border-emerald-500/10">
                                Verified Node Transactions
                            </div>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-20 text-center animate-pulse text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Decoding ledger states...</div>
                            ) : transactions.length === 0 ? (
                                <div className="p-20 text-center text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic">No transaction records found in kernel ledger</div>
                            ) : (
                                transactions.map((tx, i) => (
                                    <div key={i} className="p-8 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-6">
                                            <div className={`p-4 rounded-2xl ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                {tx.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors italic">{tx.description || (tx.amount > 0 ? 'Credit Allocation' : 'Resource Consumption')}</div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                    <Clock size={10} /> {new Date(tx.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`text-base font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                                                {tx.amount > 0 ? '+' : ''}₹{(tx.amount / 100).toFixed(2)}
                                            </div>
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Success</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="glass p-10 rounded-[3.5rem] border border-blue-500/20 bg-blue-600/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20">
                                <Zap size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic italic">Allocate Credits</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {['100', '500', '1000', '5000'].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setTopUpAmount(amt)}
                                        className={`py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border ${topUpAmount === amt ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>

                            <div className="relative group">
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-xl font-black text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-800"
                                    placeholder="Other Amount"
                                    value={topUpAmount}
                                    onChange={e => setTopUpAmount(e.target.value)}
                                />
                                <div className="absolute right-5 top-5 text-xs font-black text-blue-500 opacity-40 uppercase tracking-widest italic">INR</div>
                            </div>

                            <button
                                onClick={handleTopUp}
                                disabled={payLoading || !topUpAmount}
                                className="w-full group relative overflow-hidden bg-white text-slate-950 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-white/5 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {payLoading ? <RefreshCw className="animate-spin" size={18} /> : <CreditCard size={18} />}
                                    {payLoading ? 'Authorizing Gateway...' : 'Initiate Allocation'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                            </button>

                            <div className="flex items-start gap-3 p-5 bg-white/5 rounded-2xl border border-white/5">
                                <Shield size={16} className="text-slate-600 shrink-0" />
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                                    Transactions are processed via <span className="text-white">AES-256 Symmetric Encryption</span> through the Cashfree Payment Gateway. Wrexer does not store raw card credentials.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="glass p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="flex items-center gap-3 mb-6">
                            <Info size={16} className="text-blue-500" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Pricing Overview</h4>
                        </div>
                        <ul className="space-y-4">
                            <PricingItem label="Kata Container (Small)" price="₹0.18/h" />
                            <PricingItem label="Standard Cluster (Basic)" price="₹0.12/h" />
                            <PricingItem label="Managed Postgres (10GB)" price="₹0.45/h" />
                            <PricingItem label="Block Storage (100GB)" price="₹0.25/h" />
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PricingItem({ label, price }) {
    return (
        <li className="flex items-center justify-between border-b border-white/[0.03] pb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-[11px] font-black text-blue-400 italic">{price}</span>
        </li>
    );
}
