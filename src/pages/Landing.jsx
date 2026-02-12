import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
    LogIn
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const heroBtnRef = useRef(null);

    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

    const handleCredential = async (id_token) => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const res = await fetch(`${API_BASE}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Authentication failed');

            login(data.key, data.user || null);
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
                        <a href="#about" className="hover:text-white transition-all hover:scale-105">Infrastructure</a>
                    </nav>

                    <div className="flex items-center gap-4">
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
                            Cloud Native Orchestration
                        </div>
                        <h1 className="text-6xl md:text-[84px] font-black leading-[1.05] mb-8 tracking-tight">
                            Deploy your apps <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                                without the noise.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                            The PAAS for builders. One command deployment, instant global reach,
                            and Kubernetes scale without the YAML headache.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full sm:w-auto bg-white text-slate-950 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group shadow-2xl shadow-white/5"
                                >
                                    Go to Dashboard
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <div className="google-btn-hero flex flex-col items-center gap-4">
                                    <div ref={heroBtnRef} className="h-[50px] min-w-[260px] flex items-center justify-center">
                                        {/* Google Sign-In button renders here */}
                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium animate-pulse">
                                            <LogIn size={18} />
                                            Initializing sign-in...
                                        </div>
                                    </div>
                                    {authLoading && (
                                        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Authenticating...
                                        </div>
                                    )}
                                    {authError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/10 flex items-center gap-2"
                                        >
                                            <Shield size={14} />
                                            {authError}
                                        </motion.div>
                                    )}
                                </div>
                            )}
                            <a
                                href="#infrastructure"
                                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all text-lg"
                            >
                                Documentation
                            </a>
                        </div>
                    </motion.div>

                    {/* Dashboard Preview / Terminal Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-24 relative p-2 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 max-w-5xl mx-auto"
                    >
                        <div className="bg-[#0b1121] rounded-[1.8rem] border border-white/5 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] overflow-hidden">
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-[#0b1121]/50">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/40" />
                                </div>
                                <div className="mx-auto text-xs text-slate-500 font-mono flex items-center gap-2">
                                    <Terminal size={12} />
                                    deploy-service --cluster=rox-main --image=nginx:latest
                                </div>
                            </div>
                            <div className="p-10 font-mono text-base md:text-lg">
                                <div className="flex gap-3 text-slate-100 whitespace-pre text-left">
                                    <span className="text-blue-500">$</span> wrexer deploy my-api --small
                                </div>
                                <div className="text-slate-400 mt-6 space-y-2 text-left">
                                    <p className="flex items-center gap-3">
                                        <Layers size={16} className="text-blue-500" />
                                        Fetching image: <span className="text-blue-400">nginx:latest</span>
                                    </p>
                                    <p className="flex items-center gap-3">
                                        <Cpu size={16} className="text-indigo-400" />
                                        Provisioning: <span className="text-indigo-400">100m CPU / 128Mi RAM</span>
                                    </p>
                                    <p className="flex items-center gap-3">
                                        <Globe size={16} className="text-purple-400" />
                                        Routing: <span className="text-purple-400">app-6277.10.58.89.249.nip.io</span>
                                    </p>
                                    <p className="flex items-center gap-3 pt-4 text-green-400 font-bold">
                                        <CheckCircle2 size={18} />
                                        ✓ Application Live: https://my-api.wrexer.com
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Trusted By / Stats */}
            <section className="py-20 border-y border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-center">
                    <StatItem label="Average Deployment" value="< 5s" />
                    <StatItem label="Uptime Guarantee" value="99.9%" />
                    <StatItem label="Active Containers" value="1.2k+" />
                    <StatItem label="Server Overhead" value="0.1%" />
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

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="text-yellow-400" />}
                            title="Instant Cold Start"
                            desc="Optimized container orchestration ensures your apps are live and serving traffic in milliseconds."
                        />
                        <FeatureCard
                            icon={<Shield className="text-blue-400" />}
                            title="Hardened Security"
                            desc="Isolated namespaces, automated SSL, and DDoS protection baked into every deployment."
                        />
                        <FeatureCard
                            icon={<Box className="text-purple-400" />}
                            title="Auto-Healing K3s"
                            desc="Powered by k3s, we automatically restart or migrate your apps if any underlying hardware fails."
                        />
                        <FeatureCard
                            icon={<Globe className="text-emerald-400" />}
                            title="Smart Routing"
                            desc="Global edge routing through Traefik ensures low-latency access from anywhere in the world."
                        />
                        <FeatureCard
                            icon={<Layers className="text-rose-400" />}
                            title="Resource Control"
                            desc="Granular cgroup limits (CPU/RAM) ensure your apps never fight for resources."
                        />
                        <FeatureCard
                            icon={<Terminal className="text-indigo-400" />}
                            title="API First"
                            desc="Full programmatic control. Integrate wrexer into your existing CI/CD or internal tools."
                        />
                    </div>
                </div>
            </section>

            {/* Plans Section */}
            <section id="plans" className="py-32 bg-white/[0.01] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Simple Pricing.</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-xl font-medium">
                            Pay for what you use. No hidden fees, no complexity.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <PlanCard
                            name="Tiny"
                            price="Free"
                            cpu="25m"
                            ram="32Mi"
                            bestFor="Hobbies & Testing"
                            isMain={false}
                        />
                        <PlanCard
                            name="Small"
                            price="0.5/hr"
                            cpu="100m"
                            ram="128Mi"
                            bestFor="Production APIs"
                            isMain={true}
                        />
                        <PlanCard
                            name="Medium"
                            price="₹2/hr"
                            cpu="500m"
                            ram="512Mi"
                            bestFor="Web Apps"
                            isMain={false}
                        />
                        <PlanCard
                            name="Large"
                            price="₹4/hr"
                            cpu="1.0 Core"
                            ram="1024Mi"
                            bestFor="Heavy Compute"
                            isMain={false}
                        />
                    </div>
                </div>
            </section>

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
                                <SocialLink icon={<Github size={20} />} href="#" />
                                <SocialLink icon={<Twitter size={20} />} href="#" />
                                <SocialLink icon={<Linkedin size={20} />} href="#" />
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

function StatItem({ label, value }) {
    return (
        <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.03] transition-colors">
            <div className="text-4xl font-black text-white mb-2">{value}</div>
            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">{label}</div>
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

function PlanCard({ name, price, cpu, ram, bestFor, isMain }) {
    return (
        <div className={`p-10 rounded-[2.5rem] border ${isMain ? 'bg-blue-600 border-blue-400 shadow-[0_20px_50px_rgba(37,99,235,0.3)] scale-105 relative z-10' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all'} flex flex-col`}>
            {isMain && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                    Popular
                </div>
            )}
            <h3 className={`text-xl font-bold mb-2 ${isMain ? 'text-white' : 'text-slate-400'}`}>{name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black">{price}</span>
            </div>
            <p className={`text-sm mb-8 font-medium ${isMain ? 'text-blue-100' : 'text-slate-500'}`}>{bestFor}</p>

            <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm font-semibold">
                    <Cpu size={18} className={isMain ? 'text-white' : 'text-blue-500'} />
                    {cpu} Cluster Slice
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold">
                    <Layers size={18} className={isMain ? 'text-white' : 'text-indigo-500'} />
                    {ram} Memory Guard
                </li>
                <li className="flex items-center gap-3 text-sm font-semibold">
                    <CheckCircle2 size={18} className={isMain ? 'text-white' : 'text-green-500'} />
                    Instant Scalability
                </li>
            </ul>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all ${isMain ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                Choose {name}
            </button>
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
