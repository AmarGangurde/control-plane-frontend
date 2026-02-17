import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp, Rocket, Cpu, Activity, Zap, Box, ShieldCheck, CreditCard, Globe } from 'lucide-react';

export default function CreateApp() {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [port, setPort] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('p-tiny');
  const [loading, setLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced state
  const [envVars, setEnvVars] = useState([{ name: '', value: '' }]);
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState(['']);

  useEffect(() => {
    // fetch plans
    api.billing.plans().then(setPlans).catch(console.error);
  }, []);

  const addEnvVar = () => setEnvVars([...envVars, { name: '', value: '' }]);
  const removeEnvVar = (index) => setEnvVars(envVars.filter((_, i) => i !== index));
  const updateEnvVar = (index, field, value) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const addArg = () => setArgs([...args, '']);
  const removeArg = (index) => setArgs(args.filter((_, i) => i !== index));
  const updateArg = (index, value) => {
    const updated = [...args];
    updated[index] = value;
    setArgs(updated);
  };

  const submit = async () => {
    setLoading(true);
    setCreateMsg(null);
    try {
      // Filter empty env vars
      const filteredEnv = envVars.filter(ev => ev.name.trim() !== '');

      // Filter empty args
      const filteredArgs = args.filter(a => a.trim() !== '');

      // Kubernetes expects command as an array of strings
      const parsedCommand = command.trim() ? [command.trim()] : undefined;

      const res = await api.apps.create({
        name: name.trim(),
        image: image.trim(),
        port: port ? parseInt(port, 10) : undefined,
        planId: selectedPlan,
        env: filteredEnv.length > 0 ? filteredEnv : undefined,
        command: parsedCommand,
        args: filteredArgs.length > 0 ? filteredArgs : undefined
      });

      setCreateMsg({ type: 'success', text: `Instance successfully architected: ${res.url}` });
      window.dispatchEvent(new Event('apps:reload'));

      // Reset form
      setName('');
      setImage('');
      setPort('');
      setEnvVars([{ name: '', value: '' }]);
      setCommand('');
      setArgs(['']);
      setShowAdvanced(false);
    } catch (e) {
      setCreateMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="bg-[#0f172a]/40 p-8 md:p-12 rounded-[2.5rem] border border-white/5 mb-14 backdrop-blur-md shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-12 opacity-[0.02] -rotate-12 select-none pointer-events-none">
        <Rocket size={240} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <span className="bg-blue-600/20 p-2 rounded-2xl text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <Plus size={24} />
            </span>
            Architect New Instance
          </h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-1">Universal Container Deployment Engine v2.4</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${showAdvanced ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
            }`}
        >
          <Settings2 size={14} className={showAdvanced ? 'rotate-90' : ''} />
          Advanced Parameters {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {createMsg && (
        <div className={`p-5 rounded-[1.5rem] mb-10 font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4 duration-500 relative z-10 ${createMsg.type === 'success'
          ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-lg shadow-green-500/5'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
          {createMsg.type === 'success' ? <ShieldCheck size={20} /> : <Zap size={20} />}
          {createMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase tracking-widest">Instance Label</label>
          <div className="relative">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500/40 transition-all font-bold placeholder:text-slate-700 shadow-inner"
              placeholder="production-api"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Box size={18} className="absolute right-4 top-4 text-slate-700" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase tracking-widest">Inbound Traffic Port</label>
          <div className="relative font-mono text-sm">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="Default: Auto-Detect (e.g. 80)"
              value={port}
              onChange={e => setPort(e.target.value)}
            />
            <Globe size={18} className="absolute right-4 top-4 text-slate-700 font-sans" />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-[10px] font-black text-slate-500 mb-1 ml-1 uppercase tracking-widest">Container Image Repository</label>
          <div className="relative font-mono text-sm">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="e.g. docker.io/library/nginx:latest"
              value={image}
              onChange={e => setImage(e.target.value)}
            />
            <Zap size={18} className="absolute right-4 top-4 text-slate-700 font-sans" />
          </div>
        </div>

        {showAdvanced && (
          <div className="md:col-span-2 space-y-8 animate-in slide-in-from-top-4 fade-in duration-500">
            {/* Env Vars */}
            <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 relative overflow-hidden group/env">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/env:scale-110 transition-transform">
                <Settings2 size={120} />
              </div>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Runtime Environment Engine</label>
                  <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">Dynamic key-value pairs for container context</p>
                </div>
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all active:scale-90"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-3 relative z-10">
                {envVars.map((ev, i) => (
                  <div key={i} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                    <input
                      placeholder="KEY_NAME"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                      value={ev.name}
                      onChange={(e) => updateEnvVar(i, 'name', e.target.value)}
                    />
                    <input
                      placeholder="v_4lu_3"
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                      value={ev.value}
                      onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(i)}
                      className="p-3.5 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Command (Entrypoint) */}
              <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 relative group/cmd">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/cmd:scale-110 transition-transform">
                  <Terminal size={80} />
                </div>
                <label className="block text-[10px] font-black text-blue-500 mb-1 uppercase tracking-[0.2em] relative z-10">Custom Entrypoint</label>
                <p className="text-[10px] text-slate-600 mb-5 font-bold uppercase relative z-10">Override image execution vector</p>
                <input
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-blue-500/40 transition-all font-mono relative z-10"
                  placeholder="e.g. /usr/bin/node"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                />
              </div>

              {/* Arguments */}
              <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 relative group/arg">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/arg:scale-110 transition-transform">
                  <Activity size={80} />
                </div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Execution Flags</label>
                    <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">Dynamic arguments for entrypoint</p>
                  </div>
                  <button
                    type="button"
                    onClick={addArg}
                    className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all active:scale-90"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="space-y-3 relative z-10">
                  {args.map((arg, i) => (
                    <div key={i} className="flex gap-4 animate-in slide-in-from-right-2 duration-300">
                      <input
                        placeholder={`Arg ${i + 1} (--port=8080)`}
                        className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                        value={arg}
                        onChange={(e) => updateArg(i, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeArg(i)}
                        className="p-3.5 text-slate-600 hover:text-red-400 transition-all"
                        disabled={args.length === 1 && arg === ''}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="md:col-span-2 mt-4">
          <label className="block text-[10px] font-black text-slate-500 mb-4 ml-1 uppercase tracking-[0.4em]">Resource Provisioning Plan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {plans.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`group relative border rounded-[2rem] p-6 cursor-pointer transition-all duration-300 overflow-hidden ${selectedPlan === p.id
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
                  : 'border-white/5 hover:border-white/20 hover:bg-white/[0.03] shadow-xl'
                  }`}
              >
                {selectedPlan === p.id && (
                  <div className="absolute top-3 right-3 text-blue-400">
                    <ShieldCheck size={16} />
                  </div>
                )}
                <div className="font-black text-white text-sm tracking-tight uppercase group-hover:text-blue-400 transition-colors">{p.name}</div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <Cpu size={12} className="text-blue-500/50" />
                    {p.cpu}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <Zap size={12} className="text-purple-500/50" />
                    {p.memory}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-400 font-mono tracking-tighter">₹{(p.price_per_hour / 100).toFixed(2)}<span className="text-slate-600 text-[8px] ml-1">/HR</span></span>
                  <CreditCard size={12} className="text-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest max-w-sm text-center md:text-left leading-relaxed">
          Provisioning will occur on US-EAST-1A. Resource locks will be active for 60 seconds during initial bootstrap.
        </p>
        <button
          type="submit"
          disabled={loading || !image || !name}
          className="group bg-blue-600 text-white px-12 py-5 rounded-[1.5rem] hover:bg-blue-500 active:scale-95 disabled:opacity-30 font-black transition-all shadow-2xl shadow-blue-600/30 w-full md:w-auto uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <RotateCw size={16} className="animate-spin" />
              MANIFESTING INSTANCE...
            </>
          ) : (
            <>
              <Rocket size={16} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              INITIATE CLOUD DEPLOYMENT
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function RotateCw({ size, className }) {
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
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  )
}
