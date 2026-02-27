import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp, Zap, Sparkles, Box, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateApp() {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [port, setPort] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('p-small');
  const [loading, setLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced state
  const [envVars, setEnvVars] = useState([{ name: '', value: '' }]);
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState(['']);
  const [replicas, setReplicas] = useState(1);

  useEffect(() => {
    api.billing.plans().then(data => {
      const appPlans = data.filter(p => !p.id.startsWith('db-'));
      const regular = appPlans.filter(p => !p.coming_soon);
      const comingSoon = appPlans.filter(p => p.coming_soon);
      setPlans([...regular, ...comingSoon]);
    }).catch(console.error);
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
    if (value.trim().includes(' ') && !value.includes('\\ ')) {
      const parts = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
      if (parts && parts.length > 1) {
        const cleanedParts = parts.map(p => p.replace(/^["']|["']$/g, ''));
        const updated = [...args];
        updated.splice(index, 1, ...cleanedParts);
        setArgs(updated);
        return;
      }
    }
    const updated = [...args];
    updated[index] = value;
    setArgs(updated);
  };

  const submit = async () => {
    setLoading(true);
    setCreateMsg(null);
    try {
      const filteredEnv = envVars.filter(ev => ev.name.trim() !== '');
      const filteredArgs = args.filter(a => a.trim() !== '');
      const parsedCommand = command.trim() ? [command.trim()] : undefined;

      const res = await api.apps.create({
        name: name.trim(),
        image: image.trim(),
        port: port ? parseInt(port, 10) : undefined,
        planId: selectedPlan,
        env: filteredEnv.length > 0 ? filteredEnv : undefined,
        command: parsedCommand,
        args: filteredArgs.length > 0 ? filteredArgs : undefined,
        replicas: parseInt(replicas, 10)
      });

      setCreateMsg({ type: 'success', text: `Instance initialized: ${res.url}` });
      window.dispatchEvent(new Event('apps:reload'));

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
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="glass p-10 rounded-[2.5rem] border border-white/5 mb-12 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <Sparkles size={120} className="text-blue-500" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
        <div>
          <h3 className="text-2xl font-black tracking-tighter text-white">Initialize New Instance</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">High-performance container orchestration</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${showAdvanced ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
        >
          <Settings2 size={16} />
          Advanced Parameters {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <AnimatePresence>
        {createMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-5 rounded-2xl mb-8 font-bold border flex items-center gap-3 ${createMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
          >
            {createMsg.type === 'success' ? <Zap size={18} /> : <Info size={18} />}
            {createMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-slate-500 mb-2.5 uppercase tracking-widest">Global Application Name</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-white/10"
            placeholder="e.g. monolith-api-service"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 mb-2.5 uppercase tracking-widest">Internal Ingress Port</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono placeholder:text-white/10"
            placeholder="Auto-detect (e.g. 80)"
            value={port}
            onChange={e => setPort(e.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-500 mb-2.5 uppercase tracking-widest">Docker Registry Image (OCI)</label>
          <div className="relative group">
            <input
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono placeholder:text-white/10 pr-12"
              placeholder="registry.hub.docker.com/library/nginx:latest"
              value={image}
              onChange={e => setImage(e.target.value)}
            />
            <Box size={20} className="absolute right-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          </div>
        </div>

        <motion.div
          animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
          className="md:col-span-3 overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 pb-8">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-blue-400 mb-4 uppercase tracking-[0.2em] italic">Runtime Scaling</label>
              <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={replicas}
                    onChange={e => setReplicas(e.target.value)}
                  />
                  <div className="flex justify-between mt-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <span>Single Instance</span>
                    <span>High Availability</span>
                  </div>
                </div>
                <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-600/30">
                  {replicas}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Env Configuration</label>
                <button type="button" onClick={addEnvVar} className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all">
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {envVars.map((ev, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      placeholder="KEY"
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white focus:outline-none focus:border-blue-500 font-mono"
                      value={ev.name}
                      onChange={(e) => updateEnvVar(i, 'name', e.target.value)}
                    />
                    <input
                      placeholder="VALUE"
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-white focus:outline-none focus:border-blue-500 font-mono"
                      value={ev.value}
                      onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                    />
                    <button type="button" onClick={() => removeEnvVar(i)} className="p-3 text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
              <label className="block text-[10px] font-black text-blue-400 mb-4 uppercase tracking-widest italic text-center">Execution Context</label>
              <div className="space-y-6">
                <div>
                  <label className="block text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest">Custom Entrypoint</label>
                  <input
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-blue-400 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. /usr/local/bin/python3"
                    value={command}
                    onChange={e => setCommand(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Process Arguments</label>
                    <button type="button" onClick={addArg} className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {args.map((arg, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          placeholder={`Arg ${i + 1}`}
                          className="flex-1 bg-black/40 border border-white/5 rounded-xl p-2.5 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
                          value={arg}
                          onChange={(e) => updateArg(i, e.target.value)}
                        />
                        <button type="button" onClick={() => removeArg(i)} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-500 mb-6 uppercase tracking-widest text-center">Node Cluster Resource Allocation</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(p => {
              const isSelected = selectedPlan === p.id;
              const isComingSoon = p.coming_soon || p.runtime === 'kata';
              return (
                <div
                  key={p.id}
                  onClick={() => !isComingSoon && setSelectedPlan(p.id)}
                  className={`relative p-6 rounded-[2rem] border transition-all duration-500 ${isComingSoon ? 'opacity-40 cursor-not-allowed border-purple-500/20 bg-purple-500/5' : isSelected ? 'bg-blue-600 border-blue-600 ring-8 ring-blue-600/10 shadow-2xl shadow-blue-600/20 cursor-pointer scale-105 z-10' : 'bg-white/5 border-white/5 hover:border-white/20 cursor-pointer hover:bg-white/[0.07]'}`}
                >
                  {isComingSoon && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Coming Soon</div>
                  )}
                  <div className={`text-base font-black tracking-tight mb-2 ${isSelected ? 'text-white' : 'text-slate-200'}`}>{p.name}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                    {p.cpu} / {p.memory}
                  </div>
                  <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-blue-500'}`}>
                      {p.price_per_hour > 0 ? `₹${(p.price_per_hour / 100).toFixed(2)} /h` : 'Free Tier'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-tighter ${isSelected ? 'text-blue-200/60' : 'text-slate-600'}`}>
                      ~₹{Math.round(p.price_per_hour / 100 * 720)} /month
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5 pt-10">
        <div className="flex items-center gap-4 text-slate-500">
          <div className="p-3 bg-white/5 rounded-2xl">
            <Info size={20} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-sm italic">
            Provisioning starts immediately upon validation. <span className="text-white">1 hour reserve amount</span> will be locked from your balance.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || !image || !name}
          className="relative group overflow-hidden bg-white text-slate-950 px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
        >
          <span className="relative z-10">{loading ? 'Allocating Resources...' : 'Initialize Provisioning'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        </button>
      </div>
    </motion.form>
  );
}
