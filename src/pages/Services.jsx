import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { socket } from '../api/socket';
import { useCurrency } from '../context/CurrencyContext';
import ShellModal from '../components/ShellModal';
import {
  Zap, Power, Trash2, RefreshCw, ExternalLink, AlertCircle,
  CheckCircle2, HardDrive, Cpu, Activity, Terminal,
  ChevronRight, Sparkles, Plus, X, Key, SquareTerminal, Link,
  CheckCircle, XCircle
} from 'lucide-react';

const ALIAS_BLOCKLIST = new Set([
  'www', 'api', 'admin', 'mail', 'dashboard', 'billing', 'app',
  'wrexer', 'support', 'dev', 'staging', 'ns', 'ftp', 'smtp',
  'cdn', 'static', 'assets', 'auth', 'login', 'signup', 'register',
]);
const ALIAS_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const validateAliasSlug = (s) => {
  if (!s) return null;
  if (!ALIAS_REGEX.test(s)) return 'Use 3–30 lowercase letters, numbers, hyphens.';
  if (ALIAS_BLOCKLIST.has(s)) return `"${s}" is reserved.`;
  return null;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const parseCpuToMillis = (cpu) => {
  if (!cpu) return 0;
  if (cpu.endsWith('n')) return Math.round(parseInt(cpu) / 1_000_000);
  if (cpu.endsWith('m')) return parseInt(cpu);
  if (!isNaN(cpu)) return parseFloat(cpu) * 1000;
  return 0;
};

const parseMemToMiB = (mem) => {
  if (!mem) return 0;
  if (mem.endsWith('Ki')) return Math.round(parseInt(mem) / 1024);
  if (mem.endsWith('Mi')) return parseInt(mem);
  if (mem.endsWith('Gi')) return parseInt(mem) * 1024;
  return 0;
};

function getUptime(ds) {
  if (!ds) return '—';
  const d = Date.now() - new Date(ds);
  if (d < 0) return 'Just started';
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function fmt2(paise) { return `₹${(paise / 100).toFixed(2)}`; }

const STATUS_MAP = {
  running:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  deploying:   'bg-amber-500/20  text-amber-400  border-amber-500/20 animate-pulse',
  provisioning:'bg-amber-500/20  text-amber-400  border-amber-500/20 animate-pulse',
  stopped:     'bg-slate-500/20  text-slate-400  border-slate-500/20',
  failed:      'bg-red-500/20    text-red-400    border-red-500/20',
  error:       'bg-red-500/20    text-red-400    border-red-500/20',
};
const sc = (s) => STATUS_MAP[s] || 'bg-slate-800 text-slate-500 border-white/5';

// ── Logs Modal ────────────────────────────────────────────────────────────────

function LogsModal({ svc, onClose }) {
  const [container, setContainer] = useState('app');
  const [logs, setLogs]           = useState('');
  const [loading, setLoading]     = useState(true);
  const bottomRef                 = useRef(null);

  const fetchLogs = (c = container) => {
    setLoading(true);
    api.apps.logs(svc.id, c).then(d => {
      setLogs(d.logs || '(no logs yet)');
      setLoading(false);
    }).catch(e => { setLogs(`Error: ${e.message}`); setLoading(false); });
  };

  const switchContainer = (c) => { setContainer(c); fetchLogs(c); };

  useEffect(() => { fetchLogs('app'); }, [svc.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView(); }, [logs]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400"><Terminal size={18} /></div>
            <div>
              <h3 className="font-bold text-white text-sm">Workspace Logs</h3>
              <p className="text-[11px] text-slate-500 font-medium">{svc.name}</p>
            </div>
            {/* Container toggle */}
            <div className="flex items-center gap-1 ml-2 bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => switchContainer('app')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  container === 'app' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}>App</button>
              <button onClick={() => switchContainer('proxy-sidecar')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  container === 'proxy-sidecar' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}>⇄ Proxy</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchLogs(container)} disabled={loading} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-black/40 font-mono text-[13px] leading-relaxed text-slate-300">
          {loading
            ? <div className="flex items-center justify-center h-full text-slate-500 animate-pulse italic">Retrieving logs…</div>
            : <div className="whitespace-pre-wrap">{logs || 'No logs found.'}<div ref={bottomRef} /></div>}
        </div>
      </div>
    </div>
  );
}

// ── Update Keys Modal ─────────────────────────────────────────────────────────

function UpdateKeysModal({ svc, onClose, onUpdated }) {
  const [provider, setProvider]   = useState('openai');
  const [llmKey, setLlmKey]       = useState('');
  const [modelName, setModelName] = useState('');
  const [githubToken, setGhToken] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  // Alias state
  const [aliasSlug, setAliasSlug]   = useState('');
  const [aliasSaving, setAliasSaving] = useState(false);
  const [aliasMsg, setAliasMsg]     = useState(null);
  const currentAlias                = svc.alias || null;

  const PROVIDERS = [
    { id: 'openai',    label: 'OpenAI',    envKey: 'OPENAI_API_KEY',    defaultModel: 'gpt-4o-mini' },
    { id: 'anthropic', label: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', defaultModel: 'claude-3-5-haiku-20241022' },
    { id: 'gemini',    label: 'Gemini',    envKey: 'GEMINI_API_KEY',    defaultModel: 'gemini-3.1-flash-lite' },
  ];
  const sel = PROVIDERS.find(p => p.id === provider);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const serviceEnv = {};
      if (llmKey)      serviceEnv[sel.envKey]    = llmKey;
      if (modelName)   serviceEnv['LLM_MODEL']   = modelName;
      if (githubToken) serviceEnv['GITHUB_TOKEN'] = githubToken;
      await api.apps.updateServiceKeys(svc.id, serviceEnv);
      onUpdated();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleSetAlias = async () => {
    const s = aliasSlug.trim();
    if (!s || validateAliasSlug(s)) return;
    setAliasSaving(true); setAliasMsg(null);
    try {
      await api.apps.setAlias(svc.id, s);
      setAliasSlug('');
      setAliasMsg({ type: 'success', text: `✓ ${s}.wrexer.com is live!` });
      onUpdated();
    } catch (e) { setAliasMsg({ type: 'error', text: e.message }); }
    finally { setAliasSaving(false); }
  };

  const handleRemoveAlias = async () => {
    setAliasSaving(true); setAliasMsg(null);
    try {
      await api.apps.removeAlias(svc.id);
      setAliasMsg({ type: 'success', text: 'Alias removed.' });
      onUpdated();
    } catch (e) { setAliasMsg({ type: 'error', text: e.message }); }
    finally { setAliasSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600/20 p-2.5 rounded-xl text-violet-400"><Key size={18} /></div>
            <div>
              <h3 className="font-black text-white text-sm">Update Workspace</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Keys trigger rolling restart · Alias changes are instant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* LLM Provider */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-wider">LLM Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setProvider(p.id)}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all ${provider === p.id
                    ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                    : 'bg-white/3 border-white/10 text-slate-400 hover:border-white/25'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{sel.label} API Key</label>
            <input type="password" value={llmKey} onChange={e => setLlmKey(e.target.value)}
              placeholder="Leave blank to keep existing"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Model Name <span className="lowercase font-medium">(optional)</span></label>
            <input type="text" value={modelName} onChange={e => setModelName(e.target.value)}
              placeholder={`Leave blank to keep existing (default: ${sel.defaultModel})`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">GitHub PAT <span className="text-slate-600 normal-case">(optional)</span></label>
            <input type="password" value={githubToken} onChange={e => setGhToken(e.target.value)}
              placeholder="Leave blank to keep existing"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
          </div>

          {/* Alias section */}
          <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Link size={14} className="text-violet-400" />
              <label className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Custom Alias</label>
            </div>
            {currentAlias ? (
              <div className="flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-violet-400 shrink-0" />
                  <span className="text-sm font-mono font-bold text-violet-300">{currentAlias}.wrexer.com</span>
                </div>
                <button onClick={handleRemoveAlias} disabled={aliasSaving}
                  className="ml-3 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50">
                  {aliasSaving ? <RefreshCw size={10} className="animate-spin" /> : 'Remove'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-stretch gap-2">
                  <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-violet-500/50 transition-all">
                    <input
                      className="flex-1 bg-transparent p-3 text-white text-sm font-mono focus:outline-none placeholder:text-slate-600"
                      placeholder="my-workspace"
                      value={aliasSlug}
                      onChange={e => setAliasSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && handleSetAlias()}
                    />
                    <span className="px-3 text-slate-500 text-sm font-mono shrink-0">.wrexer.com</span>
                  </div>
                  <button onClick={handleSetAlias} disabled={aliasSaving || !aliasSlug || !!validateAliasSlug(aliasSlug)}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shrink-0">
                    {aliasSaving ? <RefreshCw size={12} className="animate-spin" /> : 'Set'}
                  </button>
                </div>
                {aliasSlug && validateAliasSlug(aliasSlug) && (
                  <p className="text-[10px] text-amber-400 font-semibold px-1">{validateAliasSlug(aliasSlug)}</p>
                )}
                <p className="text-[10px] text-slate-600 font-medium px-1">Free · 1 per service · 3–30 chars · lowercase + hyphens</p>
              </div>
            )}
            {aliasMsg && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold ${
                aliasMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {aliasMsg.type === 'success' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                {aliasMsg.text}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">
              <AlertCircle size={13} />{error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving || (!llmKey && !githubToken)}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-black text-sm transition-all disabled:opacity-40 shadow-lg shadow-violet-600/20">
              {saving ? <><RefreshCw size={14} className="animate-spin" />Saving…</> : <><Key size={14} />Save & Restart</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Destroy confirm modal ─────────────────────────────────────────────────────

function DestroyModal({ svc, onConfirm, onClose }) {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-red-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-500/15 text-red-400 rounded-full flex items-center justify-center mx-auto mb-5"><Trash2 size={28} /></div>
        <h3 className="text-lg font-black text-white text-center mb-2 uppercase tracking-tight">Delete Workspace</h3>
        <p className="text-slate-400 text-center text-xs font-medium mb-6 leading-relaxed">
          Permanently deletes your workspace and the <span className="text-red-400 font-bold">5Gi storage volume</span>. All files will be lost.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest text-center">Type <span className="text-white">DELETE</span> to confirm</label>
            <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center text-white focus:outline-none focus:border-red-500 transition-all font-black uppercase"
              value={text} onChange={e => setText(e.target.value.toUpperCase())} placeholder="Required" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-5 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={() => { onConfirm(svc.id); onClose(); }} disabled={text !== 'DELETE'}
              className="flex-1 px-5 py-3 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-500 disabled:opacity-20 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ServiceRow (database-style table row) ─────────────────────────────────────

function ServiceRow({ svc, onStop, onStart, onDelete, onKeys, onLogs, onShell, loading, fmt }) {
  const cpuLimit   = 500;   // db-small
  const memLimit   = 1024;
  const currentCpu = parseCpuToMillis(svc.metrics?.cpu);
  const currentMem = parseMemToMiB(svc.metrics?.memory);
  const cpuPct     = Math.min((currentCpu / cpuLimit) * 100, 100);
  const memPct     = Math.min((currentMem / memLimit) * 100, 100);

  const podRate     = svc.hourly_rate || 0;
  const storageRate = svc.storage_hourly_rate || 0;
  const totalRate   = (svc.status === 'running' ? podRate : 0) + storageRate;
  const totalSpent  = svc.total_charged || 0;

  const [showDestroy, setShowDestroy] = useState(false);

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors group">
        {/* Name & info */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
              ${svc.status === 'running'
                ? 'bg-violet-900/20 border-violet-500/20 text-violet-400'
                : 'bg-slate-800/40 border-white/5 text-slate-500'}`}>
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white text-sm">{svc.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${sc(svc.status)}`}>{svc.status}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">alpine/wrexforge:latest · port 18789</div>
              {svc.url && (
                <a href={svc.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1 mt-0.5">
                  {svc.url.replace('https://', '')} <ExternalLink size={8} />
                </a>
              )}
              {svc.alias && (
                <a href={`https://${svc.alias}.wrexer.com`} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 mt-0.5">
                  <Link size={8} />{svc.alias}.wrexer.com
                </a>
              )}
            </div>
          </div>
        </td>

        {/* Resources */}
        <td className="px-6 py-4 whitespace-nowrap">
          {svc.status === 'running' ? (
            <div className="flex flex-col gap-2 min-w-[160px]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><Cpu size={9} className="text-blue-400" />CPU</div>
                  <span className="text-[10px] font-mono font-bold text-slate-300">{currentCpu}m <span className="text-slate-600">/ {cpuLimit}m</span></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${cpuPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase"><Activity size={9} className="text-purple-400" />MEM</div>
                  <span className="text-[10px] font-mono font-bold text-slate-300">{currentMem}Mi <span className="text-slate-600">/ {memLimit}Mi</span></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${memPct}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <HardDrive size={12} />
              {svc.status === 'stopped' ? '5Gi retained · storage billing active' : 'Initialising…'}
            </div>
          )}
        </td>

        {/* Billing */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col px-3 py-1.5 rounded-lg border bg-violet-500/10 border-violet-500/20 w-fit">
            <span className="text-[10px] font-bold text-violet-500/70 uppercase tracking-wider mb-0.5">WrexForge Workspace</span>
            <div className="text-[9px] text-violet-400/80 font-medium mb-1">
              {fmt2(totalRate)}/hr · ~{fmt2(totalRate * 720)}/mo
            </div>
            <div className="text-[9px] text-slate-500">
              <span className="font-mono">{fmt2(storageRate)}</span> storage always
            </div>
            <span className="text-xs text-violet-300 font-bold mt-1">
              {fmt(totalSpent / 100)} <span className="text-[9px] font-normal opacity-70">paid</span>
            </span>
          </div>
        </td>

        {/* Created */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-xs text-slate-500 font-mono">{getUptime(svc.created_at)}</span>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            {/* Open */}
            {svc.url && svc.status === 'running' && (
              <a href={svc.url} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-all" title="Open Workspace">
                <ExternalLink size={14} />
              </a>
            )}
            {/* Update (keys + alias) */}
            <button onClick={() => onKeys(svc)}
              className="p-2 rounded-lg bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 transition-all" title="Update Keys & Alias">
              <Key size={14} />
            </button>
            {/* Shell — app container only */}
            {svc.status === 'running' && (
              <button onClick={() => onShell(svc, 'app')}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all" title="App Shell">
                <SquareTerminal size={14} />
              </button>
            )}
            {/* Logs */}
            <button onClick={() => onLogs(svc)}
              className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all" title="Logs">
              <Terminal size={14} />
            </button>
            {/* Stop / Start */}
            {svc.status === 'stopped' ? (
              <button onClick={() => onStart(svc.id)} disabled={loading}
                className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-all" title="Start">
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
              </button>
            ) : (
              <button onClick={() => onStop(svc.id)} disabled={loading || svc.status === 'deploying'}
                className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all disabled:opacity-30" title="Stop (storage keeps billing)">
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
              </button>
            )}
            {/* Delete */}
            <button onClick={() => setShowDestroy(true)} disabled={loading}
              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all" title="Delete Workspace">
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {showDestroy && (
        <DestroyModal svc={svc} onConfirm={onDelete} onClose={() => setShowDestroy(false)} />
      )}
    </>
  );
}

// ── WrexForgeWizard ────────────────────────────────────────────────────────────

function WrexForgeWizard({ onClose, onLaunched }) {
  const [step, setStep]           = useState(1);
  const [provider, setProvider]   = useState('openai');
  const [llmKey, setLlmKey]       = useState('');
  const [modelName, setModelName] = useState('');
  const [githubToken, setGhToken] = useState('');
  const [launching, setLaunching] = useState(false);
  const [error, setError]         = useState('');

  const PROVIDERS = [
    { id: 'openai',    label: 'OpenAI',    envKey: 'OPENAI_API_KEY',    placeholder: 'sk-...', defaultModel: 'gpt-4o-mini' },
    { id: 'anthropic', label: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...', defaultModel: 'claude-3-5-haiku-20241022' },
    { id: 'gemini',    label: 'Gemini',    envKey: 'GEMINI_API_KEY',    placeholder: 'AIza...', defaultModel: 'gemini-3.1-flash-lite' },
  ];
  const sel = PROVIDERS.find(p => p.id === provider);

  const handleLaunch = async () => {
    setLaunching(true); setError('');
    try {
      const serviceEnv = {};
      if (llmKey)      serviceEnv[sel.envKey]    = llmKey;
      if (modelName)   serviceEnv['LLM_MODEL']   = modelName;
      if (githubToken) serviceEnv['GITHUB_TOKEN'] = githubToken;
      await api.apps.create({ name: 'WrexForge-WorkSpace', type: 'service', serviceEnv });
      onLaunched();
    } catch (e) { setError(e.message || 'Launch failed'); }
    finally { setLaunching(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#020617]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0f172a] border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600/20 p-2.5 rounded-xl text-violet-400"><Sparkles size={18} /></div>
            <div>
              <h2 className="text-white font-black text-base">Launch WrexForge</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-black text-sm mb-1">LLM Provider</h3>
                <p className="text-[11px] text-slate-500">Select your AI provider and paste the API key.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id)}
                    className={`p-3 rounded-xl border text-xs font-black transition-all ${provider === p.id
                      ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                      : 'bg-white/3 border-white/10 text-slate-400 hover:border-white/25'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{sel.label} API Key</label>
                <input type="password" value={llmKey} onChange={e => setLlmKey(e.target.value)} placeholder={sel.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Model Name <span className="lowercase font-medium">(optional)</span></label>
                <input type="text" value={modelName} onChange={e => setModelName(e.target.value)} placeholder={sel.defaultModel}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
              </div>
              <button onClick={() => setStep(2)} disabled={!llmKey.trim()}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-30">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-black text-sm mb-1">GitHub Token <span className="text-slate-500 font-medium">(optional)</span></h3>
                <p className="text-[11px] text-slate-500">Allows WrexForge to clone private repos and push code on your behalf.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">GitHub PAT</label>
                <input type="password" value={githubToken} onChange={e => setGhToken(e.target.value)} placeholder="ghp_..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Back</button>
                <button onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all">
                  {githubToken ? 'Continue' : 'Skip'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-black text-sm mb-1">Review & Launch</h3>
                <p className="text-[11px] text-slate-500">Wrexer will provision your workspace in seconds.</p>
              </div>
              <div className="bg-white/3 rounded-xl border border-white/8 divide-y divide-white/5 overflow-hidden">
                {[
                  ['Image',    'alpine/wrexforge:latest'],
                  ['Plan',     'DB Small (auto-selected)'],
                  ['Storage',  '5Gi persistent (billed always)'],
                  ['LLM',      <><CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />{sel.label} key set</>],
                  ['GitHub',   githubToken ? <><CheckCircle2 size={11} className="text-emerald-400 inline mr-1" />Token set</> : <span className="text-slate-600">Skipped</span>],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{k}</span>
                    <span className="text-[11px] text-slate-300 font-medium font-mono flex items-center">{v}</span>
                  </div>
                ))}
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">
                  <AlertCircle size={13} />{error}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">Back</button>
                <button onClick={handleLaunch} disabled={launching}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50">
                  {launching ? <><RefreshCw size={14} className="animate-spin" />Launching…</> : <><Zap size={14} />Launch Workspace</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Services page ─────────────────────────────────────────────────────────────

export default function Services() {
  const { fmt } = useCurrency();
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [keySvc, setKeySvc]         = useState(null);
  const [logsSvc, setLogsSvc]       = useState(null);
  const [shellSvc, setShellSvc]     = useState(null);
  const [error, setError]           = useState('');
  const [launchMsg, setLaunchMsg]   = useState(null);

  const loadServices = async (opts = {}) => {
    try {
      if (!opts.bg) setLoading(true);
      const all = await api.apps.list();
      setServices(all.filter(a => a.type === 'service'));
    } catch (e) { setError(e.message); }
    finally { if (!opts.bg) setLoading(false); }
  };

  useEffect(() => {
    loadServices();
    const iv = setInterval(() => loadServices({ bg: true }), 10_000);
    return () => clearInterval(iv);
  }, []);

  const withAction = (id, fn) => {
    setActionId(id); setError('');
    fn().then(() => loadServices({ bg: true }))
      .catch(e => setError(e.message))
      .finally(() => setActionId(null));
  };

  const handleLaunched = () => {
    setShowWizard(false);
    setLaunchMsg('Your WrexForge Workspace is being provisioned!');
    loadServices({ bg: true });
    setTimeout(() => setLaunchMsg(null), 6000);
  };

  const workspace = services.find(s => s.name === 'WrexForge-WorkSpace');
  const hasWorkspace = !!workspace;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Services</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Managed first-party infrastructure services</p>
        </div>
        <div className="text-sm font-semibold text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
          <Zap size={14} className="text-violet-400" />
          <span className="text-white">{services.length}</span>
          <span className="text-slate-500">active</span>
        </div>
      </div>

      {/* Workspace URL Card */}
      {workspace && (
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-900/30 to-indigo-900/20 border border-violet-500/30 rounded-2xl p-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_60%)]" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-violet-600/20 border border-violet-500/30 rounded-2xl flex items-center justify-center shrink-0 text-2xl">🤖</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-white text-sm">WrexForge Workspace</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    workspace.status === 'running' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                    : workspace.status === 'deploying' || workspace.status === 'provisioning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-slate-500/20 text-slate-400 border-slate-500/20'
                  }`}>{workspace.status}</span>
                </div>
                {workspace.url && (
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-violet-300 font-mono truncate">
                      {workspace.url.replace('https://', '')}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(workspace.url); }}
                      className="shrink-0 p-1 rounded-md hover:bg-white/10 text-slate-500 hover:text-violet-300 transition-colors"
                      title="Copy URL"
                    >
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            {workspace.status === 'running' && workspace.url ? (
              <a
                href={workspace.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-violet-600/30"
              >
                <span>Open Chat</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
              </a>
            ) : (
              <div className="shrink-0 flex items-center gap-2 bg-white/5 text-slate-500 px-6 py-3 rounded-xl font-black text-sm border border-white/5">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="animate-spin"><path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z"/></svg>
                <span>Provisioning…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-3.5 text-sm font-bold animate-in fade-in">
          <AlertCircle size={16} />{error}
        </div>
      )}
      {launchMsg && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-xl px-5 py-3.5 text-sm font-bold animate-in fade-in">
          <CheckCircle2 size={16} />{launchMsg}
        </div>
      )}

      {/* ── Service Catalog ── */}
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Available Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* WrexForge */}
          <div className="bg-gradient-to-br from-violet-900/20 to-indigo-900/10 border border-violet-500/20 rounded-2xl p-6 flex flex-col gap-4 hover:border-violet-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles size={22} className="text-violet-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">Available</span>
            </div>
            <div>
              <h4 className="text-white font-black text-base">WrexForge Workspace</h4>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                AI-powered developer workspace. Scaffold, modify and deploy apps with natural language — directly inside your namespace.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-bold">
              <div className="flex items-center gap-2"><HardDrive size={10} className="text-violet-400" /> 5Gi persistent workspace storage</div>
              <div className="flex items-center gap-2"><Cpu size={10} className="text-violet-400" /> DB Small plan · auto-selected</div>
              <div className="flex items-center gap-2"><Zap size={10} className="text-violet-400" /> Port 18789 · nginx sidecar</div>
            </div>
            <button onClick={() => hasWorkspace ? null : setShowWizard(true)} disabled={hasWorkspace}
              className={`mt-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all ${hasWorkspace
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'}`}>
              {hasWorkspace ? <><CheckCircle2 size={14} />Already Running</> : <><Plus size={14} />Launch</>}
            </button>
          </div>

          {/* Coming soon */}
          <div className="bg-white/2 border border-white/5 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
              <Plus size={18} className="text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-600 uppercase tracking-wider">More coming soon</p>
              <p className="text-[10px] text-slate-700 mt-1">Managed Redis, Cron Jobs, and more</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Services table ── */}
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Your Active Services</h3>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="animate-spin text-slate-600" />
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="bg-white/2 border border-white/5 rounded-2xl py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-violet-500/5 rounded-full flex items-center justify-center border border-violet-500/10">
              <Sparkles size={28} className="text-violet-500/40" />
            </div>
            <div className="text-center">
              <h4 className="text-white font-black uppercase tracking-widest text-sm">No Services Running</h4>
              <p className="text-slate-500 text-xs font-medium italic mt-1">Launch WrexForge above to get started.</p>
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="bg-[#0f172a] shadow-sm rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-white/[0.02]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Resources</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Billing</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0f172a]">
                  {services.map(svc => (
                    <ServiceRow
                      key={svc.id}
                      svc={svc}
                      fmt={fmt}
                      loading={actionId === svc.id}
                      onStop={id => withAction(id, () => api.apps.stop(id))}
                      onStart={id => withAction(id, () => api.apps.start(id))}
                      onDelete={id => withAction(id, () => api.apps.delete(id))}
                      onKeys={setKeySvc}
                      onLogs={setLogsSvc}
                      onShell={(svc, container) => setShellSvc({ id: svc.id, name: svc.name, container })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWizard  && <WrexForgeWizard onClose={() => setShowWizard(false)} onLaunched={handleLaunched} />}
      {keySvc      && <UpdateKeysModal svc={keySvc} onClose={() => setKeySvc(null)} onUpdated={() => { setKeySvc(null); loadServices({ bg: true }); }} />}
      {logsSvc     && <LogsModal svc={logsSvc} onClose={() => setLogsSvc(null)} />}
      {shellSvc    && (
        <ShellModal
          socket={socket}
          appId={shellSvc.id}
          appName={shellSvc.name}
          container={shellSvc.container || 'app'}
          onClose={() => setShellSvc(null)}
        />
      )}
    </div>
  );
}
