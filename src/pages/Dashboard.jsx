import { useAuth } from '../context/AuthContext';
import AppList from '../components/AppList';
import CreateApp from '../components/CreateApp';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-black text-white tracking-tight">System Overview</h2>
        <div className="text-sm font-semibold text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
          <span className="text-slate-500">👋</span>
          <span className="text-white">{displayName}</span>
        </div>
      </div>
      <CreateApp />
      <AppList />
    </div>
  );
}

