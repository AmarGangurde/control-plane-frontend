import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Terminal, Box, Cloud, Shield, Zap, ArrowRight, Code } from 'lucide-react';

export default function Landing() {
    const { apiKey, saveKey } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    // Navigation to dashboard handled by parent layout or conditional rendering in App.jsx
    // But if we are here, we likely don't have an auth key yet, or we want to show landing info.
    // The user requirement says: "if they are already register we will asked for api-key... if first timer we will create and show".
    // This logic matches SignInSection below.

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white">
            {/* Header */}
            <header className="absolute top-0 w-full z-50 border-b border-white/10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="text-blue-500 fill-blue-500/20" size={24} />
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            wrexer.com
                        </span>
                    </div>
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#deployment" className="hover:text-white transition-colors">Deployment</a>
                        <a href="#about" className="hover:text-white transition-colors">Who We Are</a>
                    </nav>
                    <button
                        onClick={() => setShowLogin(true)}
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm border border-white/10"
                    >
                        Start Deploying
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
                    <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Production Ready
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
                            Simple App <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                                Deployments.
                            </span>
                        </h1>
                        <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                            Deploy containers in seconds. Instant HTTPS, global scaling, and simple metered billing. No Kubernetes knowledge required.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setShowLogin(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 group"
                            >
                                Get Started
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a href="#about" className="px-8 py-4 rounded-lg font-semibold text-slate-300 hover:bg-white/5 transition-all text-lg border border-white/10">
                                Learn more
                            </a>
                        </div>
                    </motion.div>

                    {/* Terminal / Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="bg-slate-950 rounded-xl border border-white/10 shadow-2xl overflow-hidden aspect-video">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-slate-900/50">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                <div className="ml-4 text-xs text-slate-500 font-mono">bash</div>
                            </div>
                            <div className="p-6 font-mono text-sm">
                                <div className="flex gap-2 text-slate-300">
                                    <span className="text-blue-400">$</span> wrexer deploy nginx:latest
                                </div>
                                <div className="text-slate-500 mt-2">
                                    → Building container...<br />
                                    → allocating resources (Plan: Medium)...<br />
                                    → Assigning IP: 10.36.250.141...<br />
                                    <span className="text-green-400">✓ Deployed: https://app-xyz.wrexer.com</span>
                                </div>
                            </div>
                        </div>
                        {/* Floaters */}
                        <div className="absolute -top-6 -right-6 bg-slate-800 p-4 rounded-lg border border-white/10 shadow-xl">
                            <Cloud className="text-blue-400 mb-2" />
                            <div className="text-xs text-slate-400 font-mono">Status: Healthy</div>
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-slate-800 p-4 rounded-lg border border-white/10 shadow-xl">
                            <Shield className="text-green-400 mb-2" />
                            <div className="text-xs text-slate-400 font-mono">DDoS Protected</div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Login Popover (Centered for simplicity but styled as requested "popup") */}
            {showLogin && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative"
                    >
                        <button
                            onClick={() => setShowLogin(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            ✕
                        </button>
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold mb-1">Get Started</h2>
                            <p className="text-slate-400 text-sm">Sign in to deploy your first app.</p>
                        </div>

                        <SignInSection saveKey={saveKey} />
                    </motion.div>
                </div>
            )}

            {/* Features / Who We Are */}
            <section id="about" className="py-24 bg-slate-950 relative border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Who We Are</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Wrexer.com is a next-generation cloud platform built for developers who want simplicity without sacrificing power.
                            We handle the infrastructure so you can focus on shipping code.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap size={32} className="text-yellow-400" />}
                            title="Instant Deploy"
                            desc="From Docker image to live URL in less than 5 seconds. No YAML required."
                        />
                        <FeatureCard
                            icon={<Box size={32} className="text-blue-400" />}
                            title="Isolated Pods"
                            desc="Every app runs in its own secure K3s pod with guaranteed resources."
                        />
                        <FeatureCard
                            icon={<Code size={32} className="text-purple-400" />}
                            title="Control Plane API"
                            desc="Full programmatic access via our REST API. Automate everything."
                        />
                    </div>
                </div>
            </section>

            <footer className="py-8 border-t border-white/5 text-center text-slate-600 text-sm">
                © 2026 wrexer.com. All rights reserved.
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="mb-6 bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
}

function SignInSection({ saveKey }) {
    // Reusing logic from old Dashboard but styled better
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [manualKey, setManualKey] = useState('');
    const btnRef = useRef(null);
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

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
            if (!window.google || !btnRef.current) return;
            window.google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: async (resp) => {
                    await handleCredential(resp.credential);
                }
            });
            window.google.accounts.id.renderButton(btnRef.current, {
                theme: 'filled_black',
                size: 'large',
                width: '100%'
            });
        }
    }, [CLIENT_ID]);

    const handleCredential = async (id_token) => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'API error');

            // If key exists (existing user), data.key is returned.
            // If new, data.key is returned.
            // The requirement: "if they are already register we will asked for api-key" -> 
            // Actually backend now returns the KEY for both new and existing users if authenticated via Google.
            // This simplifies flow: Google Login -> Get Key -> Save Key -> Done.
            // But for "security theater" or if backend didn't return key for existing users, we'd have to ask.
            // The current backend implementation RETURNS the key always. 
            // So we can just auto-login.

            // AUTO LOGIN (Better UX)
            saveKey(data.key);

            // No need to show success/copy screen as per user request
            // setResult({ success: true, key: data.key, email: data.user.email });

        } catch (e) {
            setResult({ success: false, error: e.message });
        } finally {
            setLoading(false);
        }
    };

    // removed success UI block since we auto-redirect

    return (
        <div className="space-y-6">
            {/* Google Sign In */}
            <div className="h-12" ref={btnRef}></div>
            {loading && <div className="text-center text-slate-500 text-sm animate-pulse">Authenticating...</div>}
            {result?.error && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded">{result.error}</div>}

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-500">Or use key</span>
                </div>
            </div>

            {/* Existing User Manual Key Input (Collapsed/Secondary) */}
            <div className="flex gap-2">
                <input
                    type="password"
                    placeholder="sk_live_..."
                    value={manualKey}
                    onChange={e => setManualKey(e.target.value)}
                    className="flex-1 bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                    onClick={() => manualKey && saveKey(manualKey)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Go
                </button>
            </div>
        </div>
    );
}
