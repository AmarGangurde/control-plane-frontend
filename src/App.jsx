import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Landing from './pages/Landing';
import TInfo from './pages/TInfo';
import PInfo from './pages/PInfo';
import RInfo from './pages/RInfo';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
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
                Dashboard
              </NavLink>
              <NavLink
                to="/billing"
                className={({ isActive }) => `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Billing
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.name && (
              <span className="text-sm text-slate-400 font-medium hidden sm:inline">
                {user.name}
              </span>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 transition-all"
            >
              Sign Out
            </button>
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
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

const HomeRoute = () => {
  const { isAuthenticated } = useAuth();
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

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
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
