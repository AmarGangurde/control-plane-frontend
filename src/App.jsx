import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import Billing from './pages/Billing';
import Landing from './pages/Landing';
import TInfo from './pages/TInfo';
import PInfo from './pages/PInfo';
import RInfo from './pages/RInfo';
import ContactUs from './pages/ContactUs';
import { useState, useRef, useEffect } from 'react';
import { Settings, Key, LogOut, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from './api/client';

const SettingsMenu = () => {
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(null); // { rawKey, prefix } or null
  const [keyStatus, setKeyStatus] = useState(null); // { hasKey, prefix }
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch existing key status when menu opens
  useEffect(() => {
    if (open && !keyStatus) {
      api.auth.getApiKeyStatus().then(setKeyStatus).catch(() => { });
    }
  }, [open]);

  const handleCreateKey = async () => {
    setCreating(true);
    setError('');
    try {
      const data = await api.auth.createApiKey();
      setApiKey(data);
      setKeyStatus({ hasKey: true, prefix: data.prefix });
    } catch (e) {
      setError(e.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (apiKey?.key) {
      navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen(!open); setApiKey(null); setCopied(false); setError(''); }}
        className={`p-2 rounded-xl transition-all border ${open
          ? 'bg-white/10 text-white border-white/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
          }`}
        title="Settings"
      >
        <Settings size={20} className={`transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[340px] bg-[#0b1121] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
          {/* User info header */}
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Signed in as</div>
            <div className="text-sm font-bold text-white truncate">{user?.email || 'User'}</div>
          </div>

          {/* API Key Section */}
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Key size={14} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">API Key</span>
            </div>

            {apiKey ? (
              // Show newly created key (one-time view)
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-green-400 text-xs font-bold mb-2">
                    <CheckCircle2 size={12} />
                    Key Created — Copy it now!
                  </div>
                  <code className="text-[11px] text-green-300 break-all font-mono leading-relaxed block">
                    {apiKey.key}
                  </code>
                </div>
                <button
                  onClick={handleCopy}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${copied
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}
                >
                  {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
                </button>
                <p className="text-[10px] text-amber-400/60 text-center font-medium">
                  ⚠ This key won't be shown again. Store it securely.
                </p>
              </div>
            ) : keyStatus?.hasKey ? (
              // Show existing key info
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5 border border-white/5">
                  <code className="text-xs text-slate-300 font-mono">{keyStatus.prefix}••••••••</code>
                  <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Active</span>
                </div>
                <button
                  onClick={handleCreateKey}
                  disabled={creating}
                  className="w-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border border-amber-500/20 disabled:opacity-50"
                >
                  {creating ? 'Replacing...' : 'Replace API Key'}
                </button>
              </div>
            ) : (
              // No key yet
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">No API key created yet. Create one to access the API programmatically.</p>
                <button
                  onClick={handleCreateKey}
                  disabled={creating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Key size={14} />
                  {creating ? 'Creating...' : 'Create API Key'}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-xl border border-red-400/10">
                <AlertCircle size={12} />
                {error}
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 text-left flex items-center gap-3 text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-lg shadow-lg shadow-white/10">
                <img src="/W.png" alt="Wrexer Logo" className="w-5 h-5 object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                wrexer.com
              </span>
            </div>
            <div className="flex gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Apps
              </NavLink>
              <NavLink
                to="/databases"
                className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Databases
              </NavLink>
              <NavLink
                to="/billing"
                className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Billing
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="text-sm text-slate-400 font-medium hidden sm:inline">
                {user.email}
              </span>
            )}
            <SettingsMenu />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto pt-24 pb-12 px-6">
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const HomeRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Landing />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/terms" element={<TInfo />} />
          <Route path="/p-info" element={<PInfo />} />
          <Route path="/r-info" element={<RInfo />} />
          <Route path="/contact" element={<ContactUs />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/databases" element={
            <ProtectedRoute>
              <Databases />
            </ProtectedRoute>
          } />

          <Route path="/billing" element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
