import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp, Link, CheckCircle, XCircle, Loader } from 'lucide-react';

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
  const [replicas, setReplicas] = useState(1);

  // Alias state
  const [aliasSlug, setAliasSlug] = useState('');
  const [aliasStatus, setAliasStatus] = useState(null); // null | {checking} | {available, reason?}

  useEffect(() => {
    // fetch plans — regular first, then coming_soon (Kata) at the end
    api.billing.plans().then(data => {
      // Filter out database plans
      const appPlans = data.filter(p => !p.id.startsWith('db-'));
      const regular = appPlans.filter(p => !p.coming_soon);
      const comingSoon = appPlans.filter(p => p.coming_soon);
      setPlans([...regular, ...comingSoon]);
    }).catch(console.error);
  }, []);

  // Debounced alias availability check
  useEffect(() => {
    const slug = aliasSlug.trim();
    if (!slug || slug.length < 3) { setAliasStatus(null); return; }
    setAliasStatus({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await api.apps.checkAlias(slug);
        setAliasStatus(res); // { available: bool, reason?: string }
      } catch {
        setAliasStatus({ available: false, reason: 'Could not check availability.' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [aliasSlug]);

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
    // 1. Auto-splitting logic: If user pastes or types multiple args (respecting quotes)
    // We only trigger auto-split if there's a space that's not just trailing
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

  const getArgWarning = (val) => {
    if (!val) return null;
    if (val.startsWith('"') || val.endsWith('"') || val.startsWith("'") || val.endsWith("'")) {
      return "Leading/trailing quotes detected. The system handles quotes automatically.";
    }
    if (val.includes(',')) {
      return "Comma detected. Use separate fields for each argument index.";
    }
    if (val.trim().includes(' ') && !val.includes('"') && !val.includes("'")) {
      return "Multiple values detected. These should usually be separate fields.";
    }
    return null;
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
        args: filteredArgs.length > 0 ? filteredArgs : undefined,
        replicas: parseInt(replicas, 10),
        alias: aliasSlug.trim() || undefined,
      });

      const msg = res.aliasWarning
        ? `Deployed: ${res.url} — ⚠️ ${res.aliasWarning}`
        : `Deployed: ${res.url}${aliasSlug.trim() ? ` · alias: ${aliasSlug.trim()}.wrexer.com` : ''}`;
      setCreateMsg({ type: 'success', text: msg });
      window.dispatchEvent(new Event('apps:reload'));

      // Reset form
      setName('');
      setImage('');
      setPort('');
      setEnvVars([{ name: '', value: '' }]);
      setCommand('');
      setArgs(['']);
      setAliasSlug('');
      setAliasStatus(null);
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
      className="bg-white/5 p-8 rounded-3xl border border-white/5 mb-10"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black tracking-tight">Deploy New App</h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${showAdvanced ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
        >
          <Settings2 size={14} />
          Advanced {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {createMsg && (
        <div className={`p-4 rounded-xl mb-6 font-medium ${createMsg.type === 'success'
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
          {createMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">App Name</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            placeholder="e.g. my-awesome-app"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Container Port (Optional)</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            placeholder="Auto-detect (e.g. 80)"
            value={port}
            onChange={e => setPort(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Replicas</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            value={replicas}
            onChange={e => setReplicas(e.target.value)}
          />
          <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tight">Each replica runs a separate instance and increases billing.</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Docker Image</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
            placeholder="e.g. nginx:latest"
            value={image}
            onChange={e => setImage(e.target.value)}
          />
        </div>

        {showAdvanced && (
          <div className="md:col-span-2 space-y-8 animate-in slide-in-from-top-2 duration-300">
            {/* Env Vars */}
            <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Environment Variables</label>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase">Dynamic configuration for your app</p>
                </div>
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {envVars.map((ev, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      placeholder="e.g. MESSAGE"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                      value={ev.name}
                      onChange={(e) => updateEnvVar(i, 'name', e.target.value)}
                    />
                    <input
                      placeholder="e.g. Hello World"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/30 transition-all font-mono"
                      value={ev.value}
                      onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(i)}
                      className="p-2.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Command (Entrypoint) */}
              <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                <label className="block text-[11px] font-bold text-blue-400 mb-1.5 uppercase tracking-wider">Entrypoint (Command)</label>
                <p className="text-[10px] text-slate-500 mb-4 uppercase">Override the default image entrypoint</p>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  placeholder="e.g. /usr/bin/node"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                />
              </div>

              {/* Arguments */}
              <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Arguments (Args)</label>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">Each argument is passed separately. Do NOT include quotes or multiple values in one field.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addArg}
                    className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {args.map((arg, i) => {
                    const warning = getArgWarning(arg);
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex gap-3">
                          <input
                            placeholder={`Arg ${i + 1} (e.g. --port=80)`}
                            className={`flex-1 bg-white/5 border rounded-xl p-2.5 text-xs text-white focus:outline-none transition-all font-mono ${warning ? 'border-amber-500/50 focus:border-amber-500' : 'border-white/10 focus:border-blue-500/30'
                              }`}
                            value={arg}
                            onChange={(e) => updateArg(i, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeArg(i)}
                            className="p-2.5 text-slate-500 hover:text-red-400 transition-colors"
                            disabled={args.length === 1 && arg === ''}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {warning && (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-500/80 uppercase px-1">
                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                            {warning}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom Alias */}
            <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-1.5">
                <Link size={13} className="text-violet-400" />
                <label className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Custom Alias (Optional)</label>
              </div>
              <p className="text-[10px] text-slate-500 mb-3 uppercase">Claim a friendly URL at launch — you can also set this later</p>
              <div className="flex items-stretch gap-2">
                <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-violet-500/50 transition-all">
                  <input
                    className="flex-1 bg-transparent p-3 text-white text-sm font-mono focus:outline-none placeholder:text-slate-600"
                    placeholder="my-app"
                    value={aliasSlug}
                    onChange={e => setAliasSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                  <span className="px-3 text-slate-500 text-sm font-mono shrink-0">.wrexer.com</span>
                </div>
                <div className="flex items-center justify-center w-10">
                  {aliasStatus?.checking && <Loader size={16} className="text-slate-500 animate-spin" />}
                  {!aliasStatus?.checking && aliasStatus?.available === true && <CheckCircle size={16} className="text-emerald-400" />}
                  {!aliasStatus?.checking && aliasStatus?.available === false && <XCircle size={16} className="text-red-400" />}
                </div>
              </div>
              {/* Status message */}
              {aliasStatus && !aliasStatus.checking && (
                <p className={`text-[10px] mt-1.5 font-semibold px-1 ${aliasStatus.available ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                  {aliasStatus.available ? '✓ Available' : `✗ ${aliasStatus.reason || 'Already taken'}`}
                </p>
              )}
              {!aliasStatus && aliasSlug.length > 0 && aliasSlug.length < 3 && (
                <p className="text-[10px] mt-1.5 text-slate-600 px-1">Keep typing…</p>
              )}
            </div>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Plan</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const isComingSoon = p.coming_soon || p.runtime === 'kata';
              return (
                <div
                  key={p.id}
                  onClick={() => !isComingSoon && setSelectedPlan(p.id)}
                  className={`border rounded-2xl p-4 transition-all relative ${isComingSoon
                    ? 'border-purple-500/20 bg-purple-500/5 opacity-60 cursor-not-allowed'
                    : selectedPlan === p.id
                      ? 'border-blue-500 bg-blue-500/10 cursor-pointer'
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5 shadow-xl cursor-pointer'
                    }`}
                >
                  {isComingSoon && (
                    <div className="absolute -top-2 right-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-lg">
                      Coming Soon
                    </div>
                  )}
                  <div className={`font-bold text-sm ${isComingSoon ? 'text-purple-300/60' : 'text-white'}`}>{p.name}</div>
                  <div className={`text-[10px] mt-1 font-medium ${isComingSoon ? 'text-purple-400/40' : 'text-slate-400'}`}>{p.cpu} CPU / {p.memory} RAM</div>
                  {isComingSoon && (
                    <div className="text-[10px] text-purple-400/40 mt-0.5 font-medium">VM-isolated runtime</div>
                  )}
                  <div className="flex flex-col mt-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isComingSoon ? 'text-purple-400/40' : 'text-blue-400'}`}>
                      {p.price_per_hour > 0 ? `₹${p.price_per_hour / 100}/hr` : 'Free'}
                    </span>
                    {p.price_per_hour > 0 && (
                      <span className={`text-[9px] font-bold ${isComingSoon ? 'text-purple-400/30' : 'text-slate-500'}`}>
                        approx. ₹{{
                          'p-small': 149,
                          'p-basic': 279,
                          'p-medium': 549,
                          'p-large': 1049,
                          'p-xlarge': 1999,
                          'p-kata-small': 249,
                          'p-kata-medium': 749,
                          'p-kata-large': 1499
                        }[p.id] || (p.price_per_hour / 100 * 24 * 30).toFixed(0)}/mo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-white/5 pt-8">
        <button
          type="submit"
          disabled={loading || !image || !name}
          className="bg-blue-600 text-white px-10 py-4 rounded-2xl hover:bg-blue-500 disabled:opacity-50 font-black transition-all shadow-xl shadow-blue-600/30 w-full md:w-auto uppercase tracking-widest text-xs"
        >
          {loading ? 'Initializing Deployment...' : 'Deploy Application'}
        </button>
      </div>
    </form>
  );
}
