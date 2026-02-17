import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we check session

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await api.auth.me();
        setUser(data.user);
      } catch {
        // No valid session — that's fine
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // If logout API fails, still clear local state
    }
    setUser(null);
    // Clean up any legacy localStorage entries
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('apiKey');
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
