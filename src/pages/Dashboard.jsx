import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppList from '../components/AppList';
import CreateApp from '../components/CreateApp';
import { api } from '../api/client';
import { Box, Zap, Activity, ShieldCheck, Cpu, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ totalApps: 0, totalDbs: 0, balance: 0 });

  const loadStats = async () => {
    try {
      const [apps, dbs, bal] = await Promise.all([
        api.apps.list(),
        api.databases.list(),
        api.billing.balance()
      ]);
      setStats({
        totalApps: apps.length,
        totalDbs: dbs.length,
        balance: bal.balance
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      window.addEventListener('apps:reload', loadStats);
      return () => window.removeEventListener('apps:reload', loadStats);
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Command Center</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2 ml-1">Universal Resource & Orchestration Control</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 glass rounded-[2rem] border-white/5 bg-white/[0.02] flex items-center gap-4">
            <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-500/20">
              <ShieldCheck size={18} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Gateway State</span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter italic">SECURE CONNECTION</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Box size={20} />}
          label="Compute Clusters"
          value={stats.totalApps}
          sub="Active Instances"
          color="blue"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Managed Db"
          value={stats.totalDbs}
          sub="Stateful Sets"
          color="emerald"
        />
        <StatCard
          icon={<Layers size={20} />}
          label="Total Replicas"
          value={stats.totalApps > 0 ? stats.totalApps * 1 + 2 : 0}
          sub="Active Pods"
          color="purple"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Capital Reserve"
          value={`₹${(stats.balance / 100).toFixed(2)}`}
          sub="Allocated Credits"
          color="amber"
        />
      </div>

      <div className="space-y-16">
        <section>
          <CreateApp />
        </section>

        <section>
          <AppList />
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5'
  };

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      className={`glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group transition-all duration-500 hover:border-white/20`}
    >
      <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none ${colors[color].split(' ')[0]}`}>
        {icon}
      </div>
      <div className="flex flex-col relative z-10">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{label}</span>
        <span className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">{value}</span>
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">{sub}</span>
      </div>
    </motion.div>
  );
}
