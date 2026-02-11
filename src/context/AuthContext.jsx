import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem('authToken') || ''
  );
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (key, userData = null) => {
    localStorage.setItem('authToken', key);
    setToken(key);
    if (userData) {
      localStorage.setItem('authUser', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken('');
    setUser(null);
  };

  // Keep backward compat — also store as apiKey for api/client.js
  useEffect(() => {
    if (token) {
      localStorage.setItem('apiKey', token);
    } else {
      localStorage.removeItem('apiKey');
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
