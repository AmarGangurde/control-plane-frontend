import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { motion } from 'framer-motion';
import {
    Terminal,
    Box,
    Cloud,
    Shield,
    Zap,
    ArrowRight,
    Layers,
    Globe,
    Cpu,
    CheckCircle2,
    Github,
    Twitter,
    Linkedin,
    ExternalLink,
    LogIn,
    Lock,
    Database,
    HardDrive,
    ShieldCheck,
    Infinity,
    Play,
    Instagram,
    Network,
    Wallet,
    RefreshCw,
    ShieldAlert,
    Activity,
    Copy,
    Link as LinkIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
    const { isAuthenticated, login } = useAuth();
    const { currency, toggleCurrency, fmt } = useCurrency();
    const navigate = useNavigate();
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const heroBtnRef = useRef(null);

    const getEnv = (key) => (window._env_ && window._env_[key]) || import.meta.env[key];

    const CLIENT_ID = getEnv('VITE_GOOGLE_CLIENT_ID');
    const VITE_API_BASE = getEnv('VITE_API_BASE');
    const API_BASE = (VITE_API_BASE && VITE_API_BASE !== 'undefined') ? VITE_API_BASE : '';

    const handleCredential = async (id_token) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const API_BASE_URL = API_BASE ? (API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`) : '/api';
            const res = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token }),
                credentials: 'include', // Receive the HttpOnly cookie
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Authentication failed');

            login(data.user);
            navigate('/dashboard');
        } catch (e) {
            setAuthError(e.message);
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        if (!CLIENT_ID) return;

        const id = 'gsi-script';
        if (!document.getElementById(id)) {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.id = id;
            s.async = true;
            s.defer = true;
            s.onload = initGSI;
            document.head.appendChild(s);
        } else {
            if (window.google) initGSI();
        }

        function initGSI() {
            if (!window.google) return;
            window.google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: async (resp) => {
                    await handleCredential(resp.credential);
                }
            });

            // Render Google button into hero slot
            if (heroBtnRef.current) {
                window.google.accounts.id.renderButton(heroBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'signin_with',
                    width: 260
                });
            }
        }
    }, [CLIENT_ID]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="fixed top-0 w-full z-[80] border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-xl shadow-lg shadow-white/10">
                            <img src="/W.png" alt="Wrexer Logo" className="w-6 h-6 object-contain" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                            wrexer.com
                        </span>
                    </div>

                    <nav className="hidden md:flex gap-10 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-all hover:scale-105">Features</a>
                        <a href="#plans" className="hover:text-white transition-all hover:scale-105">Pricing</a>
                        <a href="https://github.com/wrexer" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-all hover:scale-105">Docs</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Currency Toggle */}
                        <button
                            onClick={toggleCurrency}
                            title={currency === 'USD' ? 'Switch to INR' : 'Switch to USD'}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all select-none"
                            style={{
                                background: currency === 'USD' ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                                borderColor: currency === 'USD' ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.10)',
                                color: currency === 'USD' ? '#60a5fa' : '#94a3b8'
                            }}
                        >
                            <span style={{ opacity: currency === 'USD' ? 0.45 : 1 }}>₹</span>
                            <span className="text-slate-600">/</span>
                            <span style={{ opacity: currency === 'USD' ? 1 : 0.45 }}>$</span>
                        </button>
                        {isAuthenticated && (
                            <Link
                                to="/dashboard"
                                className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/10 transition-all flex items-center gap-2 group"
                            >
                                Dashboard
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-44 pb-24 lg:pt-56 lg:pb-32">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Fast, Cheap Cloud Hosting
                        </div>
                        <h1 className="text-5xl md:text-[72px] font-black leading-[1.05] mb-12 tracking-tight">
                            Deploy apps & PostgreSQL in seconds —<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                                without cloud complexity.
                            </span>
                        </h1>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-3xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-500/20"
                                >
                                    Go to Dashboard
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <div className="google-btn-hero relative bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 p-2 pl-6 pr-2 rounded-full backdrop-blur-md flex items-center gap-4 transition-all overflow-visible">
                                    <span className="text-white font-bold whitespace-nowrap hidden sm:block">Start for Free</span>
                                    <div className="bg-white rounded-full overflow-hidden" style={{ minWidth: '220px' }}>
                                        <div ref={heroBtnRef} className="h-[44px] flex items-center justify-center">
                                            {/* Google Sign-In button renders here */}
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium animate-pulse">
                                                <LogIn size={18} />
                                                Loading...
                                            </div>
                                        </div>
                                    </div>
                                    {/* notifications */}
                                    {authLoading && (
                                        <div className="absolute top-[120%] left-1/2 -translate-x-1/2 flex items-center gap-2 text-blue-400 text-sm font-medium whitespace-nowrap mt-2">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Authenticating...
                                        </div>
                                    )}
                                    {authError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-[120%] left-1/2 -translate-x-1/2 text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/10 flex items-center gap-2 whitespace-nowrap mt-2 z-10"
                                        >
                                            <Shield size={14} />
                                            {authError}
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {!isAuthenticated && (
                                <button
                                    onClick={() => {
                                        const API_BASE_URL = API_BASE ? (API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`) : '/api';
                                        window.location.href = `${API_BASE_URL}/auth/github`;
                                    }}
                                    className="relative bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 p-2 pl-6 pr-2 rounded-full backdrop-blur-md flex items-center gap-4 transition-all overflow-visible group"
                                >
                                    <span className="text-white font-bold whitespace-nowrap hidden sm:block group-hover:text-blue-200 transition-colors">Alternative Login</span>
                                    <div className="bg-[#24292e] text-white rounded-full overflow-hidden flex items-center justify-center gap-2 px-6 h-[44px] transition-colors hover:bg-black w-full sm:w-auto" style={{ minWidth: '220px' }}>
                                        <Github size={20} className="fill-current" />
                                        <span className="font-medium text-sm">Sign in with Github</span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Visual Proof: Terminal + Video */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-24 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto items-stretch"
                        id="demo-video"
                    >
                        {/* Terminal Mockup */}
                        <div className="relative p-2 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 h-full flex flex-col">
                            <div className="bg-[#0b1121] rounded-[1.8rem] border border-white/5 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] overflow-hidden flex-1 flex flex-col">
                                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-[#0b1121]/50">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/40" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/40" />
                                    </div>
                                    <div className="mx-auto text-xs text-slate-500 font-mono flex items-center gap-2">
                                        <Terminal size={12} />
                                        deploy --app=api
                                    </div>
                                </div>
                                <div className="p-8 font-mono text-sm sm:text-base md:text-lg flex-1">
                                    <div className="flex gap-3 text-slate-100 whitespace-pre text-left">
                                        <span className="text-blue-500">$</span> wrexer deploy my-api --small
                                    </div>
                                    <div className="text-slate-400 mt-6 space-y-3 text-left">
                                        <p className="flex items-center gap-3">
                                            <Layers size={16} className="text-blue-500" />
                                            Fetching image: nginx:latest
                                        </p>
                                        <p className="flex items-center gap-3">
                                            <Cpu size={16} className="text-indigo-400" />
                                            Provisioning: 100m CPU / 128Mi RAM
                                        </p>
                                        <p className="flex items-center gap-3">
                                            <Globe size={16} className="text-purple-400" />
                                            Routing: app-6277...nip.io
                                        </p>
                                        <p className="flex items-center gap-3 py-2 text-green-400 font-bold">
                                            <CheckCircle2 size={18} />
                                            ✓ Infrastructure Ready
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Video Player */}
                        <div className="relative p-2 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 h-full flex flex-col">
                            <div className="bg-[#0b1121] rounded-[1.8rem] border border-white/5 shadow-[0_0_100px_-20px_rgba(16,185,129,0.3)] overflow-hidden flex-1 relative aspect-video lg:aspect-auto">
                                <iframe
                                    className="absolute inset-0 w-full h-full"
                                    src="https://www.youtube.com/embed/9X3vrfhCW5I?autoplay=1&mute=1&loop=1&playlist=9X3vrfhCW5I"
                                    title="Wrexer Deployment Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Simplicity Block */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-black mb-16 tracking-tight">Deploy in under a minute</h2>
                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-[25%] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                        <div className="relative bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all z-10">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-6 mx-auto">1</div>
                            <h3 className="text-xl font-black text-white mb-2">Sign in with Google</h3>
                            <p className="text-slate-400 font-medium">One click login. No credit card required.</p>
                        </div>
                        <div className="relative bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all z-10">
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-xl mb-6 mx-auto">2</div>
                            <h3 className="text-xl font-black text-white mb-2">Click Launch</h3>
                            <p className="text-slate-400 font-medium">Deploy Node.js app or PostgreSQL instantly.</p>
                        </div>
                        <div className="relative bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all z-10">
                            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-xl mb-6 mx-auto">3</div>
                            <h3 className="text-xl font-black text-white mb-2">Your app is live</h3>
                            <p className="text-slate-400 font-medium">Globally available with SSL included.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Competition / Positioning Section */}
            <section className="py-20 bg-white/[0.01] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">A simpler alternative to complex cloud platforms</h2>
                        <ul className="space-y-5 text-lg font-medium text-slate-400">
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-green-400" size={24} /> Cheaper than typical cloud setups (great Railway alternative & Render alternative)</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-green-400" size={24} /> Cleaner, simpler UI</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-green-400" size={24} /> No infrastructure complexity</li>
                            <li className="flex items-center gap-3"><CheckCircle2 className="text-green-400" size={24} /> Built for speed and clarity</li>
                        </ul>
                    </div>
                    <div className="flex-1 bg-white/[0.03] border border-white/10 p-10 rounded-[2.5rem]">
                        <h3 className="text-2xl font-black text-white mb-6">Simple. Transparent. Reliable.</h3>
                        <p className="mb-4 text-slate-300">Simple, powerful, and affordable cloud hosting with transparent pricing. No DevOps. No surprises.</p>
                        <p className="mb-8 text-slate-400 text-sm">Cheaper than traditional cloud. Built for developers who just want things to work.</p>
                        <div className="space-y-4">
                            <div className="flex bg-white/5 p-4 rounded-xl gap-4 items-center">
                                <Zap className="text-yellow-400" />
                                <span className="font-bold">Transparent billing (pay per hour)</span>
                            </div>
                            <div className="flex bg-white/5 p-4 rounded-xl gap-4 items-center">
                                <ShieldCheck className="text-emerald-400" />
                                <span className="font-bold">No hidden costs</span>
                            </div>
                            <div className="flex bg-white/5 p-4 rounded-xl gap-4 items-center">
                                <Terminal className="text-blue-400" />
                                <span className="font-bold">Real-time usage tracking</span>
                            </div>
                            <div className="flex bg-white/5 p-4 rounded-xl gap-4 items-center">
                                <Cloud className="text-purple-400" />
                                <span className="font-bold">Instant deploy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enterprise Features Section */}
            <section className="py-24 relative bg-[#020617] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            Enterprise Grade
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Built for production. <br className="hidden md:block" />Priced for everyone.</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
                            Don't let the simple UI fool you. Under the hood, Wrexer is a powerhouse of advanced cloud features designed to keep your apps running 24/7.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Micro-billing */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Wallet className="text-green-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Prepaid Micro-Billing</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Pay per second with a prepaid UPI wallet. No credit cards required, and absolutely no surprise end-of-month bills. When your balance runs out, compute stops safely.
                            </p>
                        </div>

                        {/* Zero-Downtime */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <RefreshCw className="text-blue-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Zero-Downtime Updates</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Push new code with confidence. Our rolling deployment engine spins up your new app and waits until it's 100% healthy before routing traffic to it.
                            </p>
                        </div>

                        {/* DB Grace Period */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldAlert className="text-amber-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Database Grace Period</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Out of balance? Don't panic. We pause your compute but protect your PostgreSQL storage volumes (PVC) for 3 full days so you never lose data.
                            </p>
                        </div>

                        {/* Telemetry */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Activity className="text-purple-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Real-Time Telemetry</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Debug issues instantly. We stream live logs and real-time CPU/Memory usage metrics directly to your dashboard via high-speed WebSockets.
                            </p>
                        </div>

                        {/* Auto-scaling */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Copy className="text-indigo-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Instant Scaling</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Going viral? Increase your app replicas with a single click. Wrexer seamlessly load-balances incoming traffic across all your healthy instances.
                            </p>
                        </div>

                        {/* Private Registries */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Lock className="text-rose-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Private Registries</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Keep your code secret. Securely connect your Docker Hub account and deploy closed-source applications with zero hassle.
                            </p>
                        </div>

                        {/* Custom Slugs */}
                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-all group lg:col-span-3 max-w-2xl mx-auto">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-14 h-14 shrink-0 rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <LinkIcon className="text-cyan-400" size={28} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h3 className="text-xl font-bold text-white mb-2">Custom Subdomain Slugs</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Reserve your own permanent slug (like <span className="text-blue-400 font-mono">product.wrexer.com</span>) for a small monthly fee. Attach it to any pod dynamically and our Traefik Ingress routes traffic instantly.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">The Modern Stack.</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-xl font-medium">
                            Everything you need to scale from MVP to global production without touching a single kubeconfig file.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-yellow-400" />}
                            title="Instant Apps"
                            desc="Optimized container orchestration ensures your apps are live and serving traffic in milliseconds."
                        />
                        <FeatureCard
                            icon={<Database className="text-emerald-400" />}
                            title="Managed DBs"
                            desc="Provision production-grade PostgreSQL 16 instances with one click. High availability included."
                        />
                        <FeatureCard
                            icon={<HardDrive className="text-blue-400" />}
                            title="NVMe Storage"
                            desc="Persistent Volume Claims (PVC) ensure your data survives crashes, updates, and restarts."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-indigo-400" />}
                            title="Private Mesh"
                            desc="Databases are strictly internal. Accessible only via high-speed internal Kubernetes DNS."
                        />
                    </div>
                </div>
            </section>

            {/* Plans Section */}
            <section id="plans" className="py-32 bg-white/[0.01] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Simple Pricing.</h2>
                        <p className="text-blue-400 max-w-2xl mx-auto text-xl font-bold mb-4">
                            Start for as low as {fmt(149)}/month — significantly cheaper than traditional cloud platforms.
                        </p>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
                            Pay only for what you use. No hidden charges.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <PlanCard
                            name="Tiny"
                            price="Free"
                            cpu="100m"
                            ram="128Mi"
                            bestFor="Hobbies & Testing"
                            isMain={false}
                        />
                        <PlanCard
                            name="Small"
                            priceHourly={0.20}
                            priceMonthly={149}
                            cpu="250m"
                            ram="256Mi"
                            bestFor="Production APIs"
                            isMain={false}
                        />
                        <PlanCard
                            name="Basic"
                            priceHourly={0.39}
                            priceMonthly={279}
                            cpu="500m"
                            ram="512Mi"
                            bestFor="Static & Blogs"
                            isMain={false}
                        />
                        <PlanCard
                            name="Medium"
                            priceHourly={0.76}
                            priceMonthly={549}
                            cpu="1000m (1 vCPU)"
                            ram="1Gi"
                            bestFor="Dynamic Web Apps"
                            isMain={true}
                        />
                        <PlanCard
                            name="Large"
                            priceHourly={1.45}
                            priceMonthly={1049}
                            cpu="2000m (2 vCPU)"
                            ram="2Gi"
                            bestFor="Heavy Compute"
                            isMain={false}
                        />
                        <PlanCard
                            name="XLarge"
                            priceHourly={2.75}
                            priceMonthly={1999}
                            cpu="4000m (4 vCPU)"
                            ram="4Gi"
                            bestFor="Enterprise Loads"
                            isMain={false}
                        />
                    </div>

                    {/* Database Section */}
                    <div className="mt-32">
                        <div className="text-center mb-16">
                            <div className="flex items-center gap-4 mb-4 justify-center">
                                <div className="h-px w-12 bg-emerald-500/30" />
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <Database size={14} className="text-emerald-400" />
                                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">DBaaS</span>
                                </div>
                                <div className="h-px w-12 bg-emerald-500/30" />
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black text-white mb-6">High Performance Databases.</h3>
                            <p className="text-slate-500 max-w-xl mx-auto font-medium">Fully managed PostgreSQL 16 on dedicated NVMe storage tiers.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <PlanCard
                                name="DB Small"
                                priceHourly={0.62}
                                priceMonthly={449}
                                cpu="500m"
                                ram="1Gi"
                                storage="5Gi SSD"
                                bestFor="Dev & Small Apps"
                                isMain={false}
                                type="database"
                            />
                            <PlanCard
                                name="DB Medium"
                                priceHourly={1.10}
                                priceMonthly={799}
                                cpu="1000m"
                                ram="2Gi"
                                storage="10Gi SSD"
                                bestFor="Growing Apps"
                                isMain={true}
                                type="database"
                            />
                            <PlanCard
                                name="DB Large"
                                priceHourly={2.10}
                                priceMonthly={1499}
                                cpu="2000m"
                                ram="4Gi"
                                storage="20Gi SSD"
                                bestFor="Production Traffic"
                                isMain={false}
                                type="database"
                            />
                        </div>
                    </div>

                    {/* Kata Container Plans — Coming Soon */}
                    <div className="mt-32">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                                <Shield size={14} className="text-purple-400" />
                                <span className="text-purple-400 text-xs font-black uppercase tracking-[0.2em]">Kata Containers</span>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                        </div>
                        <p className="text-center text-slate-500 text-sm font-medium max-w-xl mx-auto mb-10">
                            Hardware-virtualized isolation for security-critical workloads. Each pod runs in its own lightweight VM.
                        </p>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <PlanCard
                                name="Kata Small"
                                priceHourly={0.34}
                                priceMonthly={249}
                                cpu="250m"
                                ram="256Mi"
                                bestFor="Secure Microservices"
                                isMain={false}
                                comingSoon={true}
                            />
                            <PlanCard
                                name="Kata Medium"
                                priceHourly={1.04}
                                priceMonthly={749}
                                cpu="1000m"
                                ram="1Gi"
                                bestFor="Isolated Workloads"
                                isMain={false}
                                comingSoon={true}
                            />
                            <PlanCard
                                name="Kata Large"
                                priceHourly={2.08}
                                priceMonthly={1499}
                                cpu="2000m"
                                ram="2Gi"
                                bestFor="VM-level Security"
                                isMain={false}
                                comingSoon={true}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Founder Trust Line */}
            <div className="py-12 border-t border-white/5 bg-gradient-to-r from-[#020617] via-slate-900 to-[#020617]">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <p className="text-lg font-medium text-slate-300">
                        "Built by an independent developer. Fast support. Constant improvements."
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-24 border-t border-white/5 bg-[#020617] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-2">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-white/5 p-2 rounded-xl">
                                    <Zap className="text-blue-500" size={24} />
                                </div>
                                <span className="text-2xl font-black tracking-tight">wrexer.com</span>
                            </div>
                            <p className="text-slate-500 text-lg max-w-sm font-medium leading-relaxed">
                                High-performance application hosting on bare metal Kubernetes.
                                Built for developers who value speed and reliability.
                            </p>
                            <div className="flex gap-6 mt-8">
                                <SocialLink icon={<Github size={20} />} href="https://github.com/wrexer" />
                                <SocialLink icon={<Twitter size={20} />} href="https://twitter.com/FounderWrexer" />
                                <SocialLink icon={<Linkedin size={20} />} href="https://www.linkedin.com/company/wrexer" />
                                <SocialLink icon={<Instagram size={20} />} href="https://www.instagram.com/wrexer.dev" />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">Product</h4>
                            <ul className="space-y-4 text-slate-500 font-medium pt-1">
                                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                                <li><a href="#plans" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-blue-400 transition-colors flex items-center gap-2">API <ExternalLink size={14} /></a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">Legal</h4>
                            <ul className="space-y-4 text-slate-500 font-medium pt-1">
                                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Use</Link></li>
                                <li><Link to="/p-info" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/r-info" className="hover:text-blue-400 transition-colors">Refund Policy</Link></li>
                                <li><Link to="/contact" className="hover:text-blue-400 transition-colors font-bold text-blue-400">Contact Us</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-slate-600 font-medium text-sm">
                            © 2026 wrexer.com. All rights reserved.
                        </div>
                        <div className="text-slate-600 text-xs text-center md:text-right font-medium max-w-xs leading-relaxed">
                            Ho no 895, Suchakar nagar, satara parisar, Chh Sambhaji Nagar, India.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}


function FeatureCard({ icon, title, desc }) {
    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.04] group"
        >
            <div className="mb-8 w-14 h-14 rounded-[1.25rem] bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors shadow-inner">
                {React.cloneElement(icon, { size: 28 })}
            </div>
            <h3 className="text-2xl font-black mb-4 text-white tracking-tight">{title}</h3>
            <p className="text-slate-400 leading-relaxed font-medium">{desc}</p>
        </motion.div>
    );
}

function PlanCard({ name, price, priceHourly, priceMonthly, cpu, ram, storage, bestFor, isMain, type = 'app', comingSoon = false }) {
    const { fmt } = useCurrency();
    const displayPrice = price || (priceHourly !== undefined ? `${fmt(priceHourly, 2)}/hr` : null);
    const displayMonthly = priceMonthly !== undefined ? `${fmt(priceMonthly, 0)}/mo` : null;
    return (
        <div className={`p-8 rounded-3xl border relative flex flex-col ${comingSoon
            ? 'bg-white/[0.01] border-purple-500/20 opacity-70'
            : type === 'database'
                ? isMain
                    ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] scale-105 z-10'
                    : 'bg-white/[0.02] border-emerald-500/20 hover:bg-emerald-500/5 transition-all'
                : isMain
                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)] scale-105 z-10'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/5 transition-all'
            }`}>
            {comingSoon && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                    <Lock size={10} />
                    Coming Soon
                </div>
            )}
            {isMain && !comingSoon && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${type === 'database' ? 'bg-emerald-500' : 'bg-blue-500'} text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl`}>
                    Popular
                </div>
            )}
            <h3 className={`text-lg font-bold mb-1 ${comingSoon ? 'text-purple-300/70' : 'text-white'}`}>{name}</h3>
            <div className="flex flex-col mb-4">
                <span className={`text-3xl font-black ${comingSoon ? 'text-slate-500' : 'text-white'}`}>{displayPrice}</span>
                {displayMonthly && <span className={`text-sm font-bold mt-1 ${comingSoon ? 'text-slate-600' : 'text-slate-400'}`}>or {displayMonthly}</span>}
            </div>
            <p className={`text-sm mb-6 font-medium ${comingSoon ? 'text-purple-400/50' : 'text-slate-400'}`}>{bestFor}</p>

            <div className="h-px w-full bg-white/10 mb-6" />

            <ul className="space-y-3 mb-8 flex-1">
                <li className={`flex items-center gap-3 text-sm font-medium ${comingSoon ? 'text-slate-600' : 'text-slate-300'}`}>
                    <Cpu size={16} className={comingSoon ? 'text-purple-500/40' : type === 'database' ? 'text-emerald-400' : 'text-blue-400'} />
                    {cpu} Cluster Slice
                </li>
                <li className={`flex items-center gap-3 text-sm font-medium ${comingSoon ? 'text-slate-600' : 'text-slate-300'}`}>
                    <Layers size={16} className={comingSoon ? 'text-purple-500/40' : type === 'database' ? 'text-emerald-400' : 'text-indigo-400'} />
                    {ram} Memory Guard
                </li>
                {storage && (
                    <li className={`flex items-center gap-3 text-sm font-medium ${comingSoon ? 'text-slate-600' : 'text-slate-300'}`}>
                        <HardDrive size={16} className={comingSoon ? 'text-purple-500/40' : 'text-emerald-400'} />
                        {storage} NVMe Storage
                    </li>
                )}
                <li className={`flex items-center gap-3 text-sm font-medium ${comingSoon ? 'text-slate-600' : 'text-slate-300'}`}>
                    <Network size={16} className={comingSoon ? 'text-purple-500/40' : type === 'database' ? 'text-emerald-400' : 'text-blue-400'} />
                    1Gbps Shared Port
                </li>
                <li className={`flex items-center gap-3 text-sm font-medium ${comingSoon ? 'text-slate-600' : 'text-slate-300'}`}>
                    {comingSoon
                        ? <Shield size={16} className="text-purple-500/40" />
                        : <CheckCircle2 size={16} className="text-green-400" />
                    }
                    {comingSoon ? 'VM-level Isolation' : type === 'database' ? 'PostgreSQL 16' : 'Instant Scalability'}
                </li>
            </ul>

        </div>
    );
}

function SocialLink({ icon, href }) {
    return (
        <a href={href} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
            {icon}
        </a>
    );
}
