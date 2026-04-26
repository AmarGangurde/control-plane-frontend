import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import {
  Zap, Power, Trash2, RefreshCw, ExternalLink, AlertCircle,
  CheckCircle2, HardDrive, Cpu, Activity, Terminal, FileText,
  ChevronRight, Sparkles, Plus, X, Key, Settings
} from 'lucide-react';

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

const STATUS_COLORS = {
  running:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  deploying:  'bg-amber-500/20  text-amber-400  border-amber-500/30 animate-pulse',
  stopped:    'bg-slate-600/20  text-slate-400  border-slate-600/30',
  failed:     'bg-red-500/20    text-red-400    border-red-500/30',
  unknown:    'bg-slate-800    text-slate-500  border-white/5',
};
const statusColor = (s) => STATUS_COLORS[s] || STATUS_COLORS.unknown;

function fmt2(paise) {
  return `₹${(paise / 100).toFixed(2)}`;
}

// ── Logs Modal ────────────────────────────────────────────────────────────────

function LogsModal({ svc, onClose }) {
  const [logs, setLogs]       = useState('Loading…');
  const [loading, setLoading] = useState(true);
  const bottomRef             = useRef(null);

  useEffect(() => {
    api.apps.logs(svc.id).then(d => {
      setLogs(d.logs || '(no logs yet)');
      setLoading(false);
    }).catch(e => { setLogs(`Error: ${e.message}`); setLoading(false); });
  }, [svc.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView(); }, [logs]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#080c13] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[75vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-violet-400" />
            <span className="text-white font-black text-sm">{svc.name} — Logs</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#060a0f]">
          {loading ? <span className="text-slate-600">Fetching logs…</span> : logs}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

// ── Update Keys Modal ─────────────────────────────────────────────────────────

function UpdateKeysModal({ svc, onClose, onUpdated }) {
  const [provider, setProvider]   = useState('openai');
  const [llmKey, setLlmKey]       = useState('');
  const [githubToken, setGhToken] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const PROVIDERS = [
    { id: 'openai',    label: 'OpenAI',    envKey: 'OPENAI_API_KEY' },
    { id: 'anthropic', label: 'Anthropic', envKey: 'ANTHROPIC_API_KEY' },
    { id: 'gemini',    label: 'Gemini',    envKey: 'GEMINI_API_KEY' },
  ];
  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const serviceEnv = {};
      if (llmKey)      serviceEnv[selectedProvider.envKey] = llmKey;
      if (githubToken) serviceEnv['GITHUB_TOKEN']          = githubToken;
      await api.apps.updateServiceKeys(svc.id, serviceEnv);
      onUpdated();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1121] border border-violet-500/20 rounded-[2.5rem] max-w-md w-full shadow-2xl shadow-violet-900/30 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Key size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-base">Update API Keys</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rolling restart on save</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"><X size={16} /></button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Provider */}
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
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{selectedProvider.label} API Key</label>
            <input type="password" value={llmKey} onChange={e => setLlmKey(e.target.value)}
              placeholder="Leave blank to keep existing"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">GitHub PAT <span className="text-slate-600">(optional)</span></label>
            <input type="password" value={githubToken} onChange={e => setGhToken(e.target.value)}
              placeholder="Leave blank to keep existing"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-4 py-3 rounded-2xl border border-red-400/15">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl bg-white/5 text-slate-400 font-black text-sm hover:bg-white/10 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={saving || (!llmKey && !githubToken)}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-violet-600/30 disabled:opacity-40">
              {saving ? <><RefreshCw size={14} className="animate-spin" />Saving…</> : <><Key size={14} />Save & Restart</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ActiveServiceCard ─────────────────────────────────────────────────────────

function ActiveServiceCard({ svc, onStop, onStart, onDelete, onUpdateKeys, onShowLogs, loading, fmt }) {
  const [confirm, setConfirm]     = useState(false);
  const [deleteText, setDeleteText] = useState('');

  // db-small: 500m CPU, 1024Mi RAM
  const cpuLimit   = 500;
  const memLimit   = 1024;
  const currentCpu = parseCpuToMillis(svc.metrics?.cpu);
  const currentMem = parseMemToMiB(svc.metrics?.memory);
  const cpuPct     = Math.min((currentCpu / cpuLimit) * 100, 100);
  const memPct     = Math.min((currentMem / memLimit) * 100, 100);

  const podRatePaise     = svc.hourly_rate || 0;
  const storageRatePaise = svc.storage_hourly_rate || 0;
  const totalRatePaise   = podRatePaise + storageRatePaise;

  return (
    <div className="bg-[#0b1121] border border-white/8 rounded-3xl overflow-hidden shadow-lg shadow-black/30 transition-all hover:border-violet-500/20 group">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all
            ${svc.status === 'running' ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
            <Zap size={22} className={svc.status === 'running' ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-base tracking-tight">{svc.name}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor(svc.status)}`}>
                {svc.status}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              OpenClaw Workspace · DB Small · 5Gi Storage
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {svc.url && svc.status === 'running' && (
            <a href={svc.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-300 text-xs font-bold hover:bg-violet-600/25 transition-all">
              Open Workspace <ExternalLink size={12} />
            </a>
          )}
          {/* Settings button */}
          <button onClick={() => onUpdateKeys(svc)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-violet-300 hover:border-violet-500/25 transition-all"
            title="Update API Keys">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-5 flex flex-col gap-5">
        {svc.status === 'running' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><Cpu size={10} className="text-blue-400" />CPU</div>
                <span className="text-[10px] font-mono font-bold text-slate-300">{currentCpu}m <span className="text-slate-600">/ {cpuLimit}m</span></span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${cpuPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase"><Activity size={10} className="text-purple-400" />MEM</div>
                <span className="text-[10px] font-mono font-bold text-slate-300">{currentMem}Mi <span className="text-slate-600">/ {memLimit}Mi</span></span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${memPct}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-white/3 rounded-xl px-4 py-3 border border-white/5">
            <HardDrive size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {svc.status === 'stopped' ? 'Workspace paused — 5Gi storage retained, billing continues' : 'Initialising workspace…'}
            </span>
          </div>
        )}

        {/* Billing — mirrors databases */}
        <div className="bg-white/3 rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compute</span>
            <span className="text-[10px] font-mono text-slate-300 font-bold">
              {svc.status === 'running' ? `${fmt2(podRatePaise)}/hr` : <span className="text-slate-600">Stopped</span>}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><HardDrive size={9} />5Gi Storage</span>
            <span className="text-[10px] font-mono text-violet-300 font-bold">{fmt2(storageRatePaise)}/hr</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/5">
            <span className="text-[10px] text-violet-400/70 font-black uppercase tracking-wider">Total Spent</span>
            <span className="text-[10px] font-mono text-violet-300 font-bold">{fmt((svc.total_charged || 0) / 100)}</span>
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2">
          {/* Logs */}
          <button onClick={() => onShowLogs(svc)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-400 text-xs font-bold hover:text-white hover:bg-white/10 transition-all">
            <FileText size={14} />Logs
          </button>

          {/* Terminal */}
          {svc.status === 'running' && (
            <a href={`/terminal?appId=${svc.id}&namespace=${svc.namespace}&pod=${svc.name}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-400 text-xs font-bold hover:text-white hover:bg-white/10 transition-all">
              <Terminal size={14} />Terminal
            </a>
          )}

          <div className="flex-1" />

          {/* Stop / Start */}
          {svc.status === 'stopped' ? (
            <button onClick={() => onStart(svc.id)} disabled={loading}
              className="p-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl border border-violet-500/20 transition-all"
              title="Start Workspace">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />}
            </button>
          ) : (
            <button onClick={() => onStop(svc.id)} disabled={loading || svc.status === 'deploying'}
              className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/20 transition-all disabled:opacity-30"
              title="Stop Workspace (storage billing continues)">
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />}
            </button>
          )}

          {/* Delete */}
          <button onClick={() => setConfirm(true)} disabled={loading}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all"
            title="Delete Workspace (permanent)">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Destroy confirm */}
      {confirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0f1a] border border-red-500/30 rounded-[2.5rem] max-w-md w-full p-10 shadow-3xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
            <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tight">Delete Workspace</h3>
            <p className="text-slate-400 text-center text-xs font-medium mb-8 leading-relaxed">
              This will permanently delete your workspace and the <span className="text-red-400 font-bold">5Gi storage volume</span>. All files will be lost and storage billing stops.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest text-center">Type <span className="text-white">DELETE</span> to confirm</label>
                <input className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-white focus:outline-none focus:border-red-500 transition-all font-black uppercase"
                  value={deleteText} onChange={e => setDeleteText(e.target.value.toUpperCase())} placeholder="Required" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => { setConfirm(false); setDeleteText(''); }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-slate-400 font-black text-xs uppercase hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={() => { onDelete(svc.id); setConfirm(false); }} disabled={deleteText !== 'DELETE'}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase hover:bg-red-500 disabled:opacity-20 transition-all">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── OpenClawWizard ────────────────────────────────────────────────────────────

function OpenClawWizard({ onClose, onLaunched }) {
  const [step, setStep]           = useState(1);
  const [provider, setProvider]   = useState('openai');
  const [llmKey, setLlmKey]       = useState('');
  const [githubToken, setGhToken] = useState('');
  const [launching, setLaunching] = useState(false);
  const [error, setError]         = useState('');

  const PROVIDERS = [
    { id: 'openai',    label: 'OpenAI',    envKey: 'OPENAI_API_KEY',    placeholder: 'sk-...' },
    { id: 'anthropic', label: 'Anthropic', envKey: 'ANTHROPIC_API_KEY', placeholder: 'sk-ant-...' },
    { id: 'gemini',    label: 'Gemini',    envKey: 'GEMINI_API_KEY',    placeholder: 'AIza...' },
  ];
  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  const handleLaunch = async () => {
    setLaunching(true);
    setError('');
    try {
      const serviceEnv = {};
      if (llmKey)      serviceEnv[selectedProvider.envKey] = llmKey;
      if (githubToken) serviceEnv['GITHUB_TOKEN']          = githubToken;
      await api.apps.create({ name: 'OpenClaw-WorkSpace', type: 'service', serviceEnv });
      onLaunched();
    } catch (e) {
      setError(e.message || 'Launch failed');
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1121] border border-violet-500/20 rounded-[2.5rem] max-w-lg w-full shadow-2xl shadow-violet-900/30 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg">Launch OpenClaw</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-2 px-8 py-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-violet-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="px-8 pb-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-white font-black text-base mb-1">LLM Provider</h3>
                <p className="text-xs text-slate-500 font-medium">Select your AI provider and paste the API key.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(p => (
                  <button key={p.id} onClick={() => setProvider(p.id)}
                    className={`p-3 rounded-2xl border text-xs font-black transition-all ${provider === p.id
                      ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                      : 'bg-white/3 border-white/10 text-slate-400 hover:border-white/25'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">{selectedProvider.label} API Key</label>
                <input type="password" value={llmKey} onChange={e => setLlmKey(e.target.value)} placeholder={selectedProvider.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
              </div>
              <button onClick={() => setStep(2)} disabled={!llmKey.trim()}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-30 shadow-lg shadow-violet-600/30">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-white font-black text-base mb-1">GitHub Token <span className="text-slate-500 font-medium text-sm">(optional)</span></h3>
                <p className="text-xs text-slate-500 font-medium">Allows OpenClaw to clone private repos and push code on your behalf.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">GitHub PAT</label>
                <input type="password" value={githubToken} onChange={e => setGhToken(e.target.value)} placeholder="ghp_..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-all font-mono" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 text-slate-400 font-black text-sm hover:bg-white/10 transition-all">Back</button>
                <button onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-violet-600/30">
                  {githubToken ? 'Continue' : 'Skip'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-white font-black text-base mb-1">Review & Launch</h3>
                <p className="text-xs text-slate-500 font-medium">Wrexer will provision your workspace in seconds.</p>
              </div>
              <div className="bg-white/3 rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Image</span>
                  <span className="text-xs text-slate-300 font-mono">alpine/openclaw:latest</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Plan</span>
                  <span className="text-xs text-violet-300 font-bold">DB Small (auto-selected)</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Storage</span>
                  <span className="text-xs text-slate-300 font-bold">5Gi persistent (billed always)</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">LLM Provider</span>
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" />{selectedProvider.label} key set
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">GitHub</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${githubToken ? 'text-slate-300' : 'text-slate-600'}`}>
                    {githubToken ? <><CheckCircle2 size={12} className="text-emerald-400" />Token set</> : 'Skipped'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-4 py-3 rounded-2xl border border-red-400/15">
                  <AlertCircle size={14} />{error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 text-slate-400 font-black text-sm hover:bg-white/10 transition-all">Back</button>
                <button onClick={handleLaunch} disabled={launching}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50">
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
  const [keySvc, setKeySvc]         = useState(null);  // service for Update Keys modal
  const [logsSvc, setLogsSvc]       = useState(null);  // service for Logs modal
  const [error, setError]           = useState('');
  const [launchMsg, setLaunchMsg]   = useState(null);

  const loadServices = async (opts = {}) => {
    try {
      if (!opts.bg) setLoading(true);
      const all = await api.apps.list();
      setServices(all.filter(a => a.type === 'service'));
    } catch (e) {
      setError(e.message);
    } finally {
      if (!opts.bg) setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    const iv = setInterval(() => loadServices({ bg: true }), 10_000);
    return () => clearInterval(iv);
  }, []);

  const withAction = (id, fn) => async () => {
    setActionId(id);
    setError('');
    try { await fn(); await loadServices({ bg: true }); }
    catch (e) { setError(e.message); }
    finally { setActionId(null); }
  };

  const handleLaunched = () => {
    setShowWizard(false);
    setLaunchMsg('Your OpenClaw Workspace is being provisioned!');
    loadServices({ bg: true });
    setTimeout(() => setLaunchMsg(null), 6000);
  };

  const handleKeysUpdated = () => {
    setKeySvc(null);
    loadServices({ bg: true });
  };

  const hasWorkspace = services.some(s => s.name === 'OpenClaw-WorkSpace');

  return (
    <div className="space-y-10">
      {/* Page header */}
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

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl px-5 py-4 text-sm font-bold animate-in fade-in">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {launchMsg && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-2xl px-5 py-4 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />{launchMsg}
        </div>
      )}

      {/* ── Service Catalog ── */}
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Available Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* OpenClaw card */}
          <div className="bg-gradient-to-br from-violet-900/20 to-indigo-900/10 border border-violet-500/20 rounded-3xl p-6 flex flex-col gap-4 hover:border-violet-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles size={22} className="text-violet-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                Available
              </span>
            </div>
            <div>
              <h4 className="text-white font-black text-base">OpenClaw Workspace</h4>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                AI-powered developer workspace. Scaffold, modify and deploy apps with natural language — directly inside your namespace.
              </p>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-bold">
              <div className="flex items-center gap-2"><HardDrive size={10} className="text-violet-400" /> 5Gi persistent workspace storage</div>
              <div className="flex items-center gap-2"><Cpu size={10} className="text-violet-400" /> DB Small plan · auto-selected</div>
              <div className="flex items-center gap-2"><Zap size={10} className="text-violet-400" /> Port 18789 · nginx sidecar</div>
            </div>
            <button
              onClick={() => hasWorkspace ? null : setShowWizard(true)}
              disabled={hasWorkspace}
              className={`mt-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all ${hasWorkspace
                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'}`}>
              {hasWorkspace ? <><CheckCircle2 size={14} />Already Running</> : <><Plus size={14} />Launch</>}
            </button>
          </div>

          {/* Coming-soon */}
          <div className="bg-white/2 border border-white/5 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
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

      {/* ── Active Services ── */}
      <div>
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Your Active Services</h3>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={20} className="animate-spin text-slate-600" />
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="bg-white/2 border border-white/5 rounded-3xl py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-violet-500/5 rounded-full flex items-center justify-center border border-violet-500/10">
              <Sparkles size={28} className="text-violet-500/40" />
            </div>
            <div className="text-center">
              <h4 className="text-white font-black uppercase tracking-widest text-sm">No Services Running</h4>
              <p className="text-slate-500 text-xs font-medium italic mt-1">Launch OpenClaw above to get started.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {services.map(svc => (
            <ActiveServiceCard
              key={svc.id}
              svc={svc}
              fmt={fmt}
              loading={actionId === svc.id}
              onStop={id => withAction(id, () => api.apps.stop(id))()}
              onStart={id => withAction(id, () => api.apps.start(id))()}
              onDelete={id => withAction(id, () => api.apps.delete(id))()}
              onUpdateKeys={setKeySvc}
              onShowLogs={setLogsSvc}
            />
          ))}
        </div>
      </div>

      {/* Wizard */}
      {showWizard && <OpenClawWizard onClose={() => setShowWizard(false)} onLaunched={handleLaunched} />}

      {/* Update Keys modal */}
      {keySvc && <UpdateKeysModal svc={keySvc} onClose={() => setKeySvc(null)} onUpdated={handleKeysUpdated} />}

      {/* Logs modal */}
      {logsSvc && <LogsModal svc={logsSvc} onClose={() => setLogsSvc(null)} />}
    </div>
  );
}
