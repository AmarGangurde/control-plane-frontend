import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('apiKey') || ''
  );

  const saveKey = (key) => {
    localStorage.setItem('apiKey', key);
    setApiKey(key);
  };

  const logout = () => {
    localStorage.removeItem('apiKey');
    setApiKey('');
  };

  return (
    <AuthContext.Provider value={{ apiKey, saveKey, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
