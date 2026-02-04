import { useAuth } from '../context/AuthContext';
import AppList from '../components/AppList';
import CreateApp from '../components/CreateApp';

export default function Dashboard() {
  const { apiKey, saveKey, logout } = useAuth();

  if (!apiKey) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Enter API Key</h2>
        <input
          type="password"
          placeholder="sk_live_..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveKey(e.target.value);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Apps</h2>
      <button onClick={logout}>Logout</button>
      <CreateApp />
      <AppList />
    </div>
  );
}
