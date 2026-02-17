import { useAuth } from '../context/AuthContext';
import AppList from '../components/AppList';
import CreateApp from '../components/CreateApp';
import { Activity, Layout, ShieldCheck, Zap } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-10 space-y-12 animate-in fade-in duration-700">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <div className="flex items-center gap-3 text-blue-500 font-black text-[10px] uppercase tracking-[0.4em] mb-3">
            <div className="w-8 h-[1px] bg-blue-500/50" />
            Central Intelligence Terminal
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter">
            System <span className="text-blue-500">Overview</span>
          </h2>
          <p className="text-slate-500 text-sm font-bold mt-3 max-w-lg leading-relaxed uppercase tracking-wider text-[11px]">
            Orchestrate containerized microservices with zero-downtime deployment pipelines and real-time observability.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm shadow-xl">
            <Stat icon={Activity} label="Active Pods" value="04" color="text-green-500" />
            <div className="w-[1px] h-8 bg-white/5" />
            <Stat icon={Zap} label="Response" value="24ms" color="text-blue-500" />
            <div className="w-[1px] h-8 bg-white/5" />
            <Stat icon={ShieldCheck} label="Sec Level" value="v9" color="text-purple-500" />
          </div>

          <div className="group flex items-center gap-4 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 p-1.5 pl-5 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all cursor-default border border-white/10 active:scale-95">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-blue-100/50 uppercase tracking-widest">Operator State</span>
              <span className="text-xs font-black text-white tracking-tight">{displayName}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black text-sm border border-white/10 shadow-inner group-hover:rotate-6 transition-transform">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Plus size={18} />
            </div>
            <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">Deployment Pipeline</h3>
          </div>
          <CreateApp />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8 text-slate-500">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Layout size={18} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-[0.2em]">Active Cloud Nodes</h3>
          </div>
          <AppList />
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-white tracking-tight ml-5">{value}</span>
    </div>
  )
}

function Plus({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

