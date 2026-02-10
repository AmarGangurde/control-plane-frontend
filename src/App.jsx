import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Landing from './pages/Landing';
import { useState } from 'react';

const Layout = ({ children, onNavigate, currentPage }) => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                KubeHost
              </span>
              <div className="flex gap-4">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('billing')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === 'billing'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Billing
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-600 text-sm font-medium px-3 py-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { apiKey } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (!apiKey) {
    return <Landing />;
  }

  return (
    <Layout onNavigate={setPage} currentPage={page}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'billing' && <Billing />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
