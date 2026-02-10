import { useAuth } from '../context/AuthContext';
import AppList from '../components/AppList';
import CreateApp from '../components/CreateApp';

export default function Dashboard() {
  const { apiKey } = useAuth();

  // Redundant check (handled in App.jsx) but good for safety
  if (!apiKey) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Wrexer Mini-Kube</h2>
      <CreateApp />
      <AppList />
    </div>
  );
}
