import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppList from '../components/AppList';
import CreateApp from '../components/CreateApp';
import { api } from '../api/client';
import { Box } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [apps, setApps] = useState([]);

  const loadApps = async () => {
    try {
      const data = await api.apps.list();
      setApps(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadApps();
    const onReload = () => loadApps();
    window.addEventListener('apps:reload', onReload);
    return () => window.removeEventListener('apps:reload', onReload);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-black text-white tracking-tight">Manage Apps</h2>
        <div className="text-sm font-semibold text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
          <Box size={14} className="text-blue-400" />
          <span className="text-white">{apps.length}</span>
          <span className="text-slate-500">instances</span>
        </div>
      </div>
      <CreateApp />
      <AppList />
    </div>
  );
}

