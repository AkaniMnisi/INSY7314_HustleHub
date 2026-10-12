import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Stub — full logic added in Step 5
  const [user] = useState(null);

  const value = {
    user,
    loading: false,
    login: async () => { throw new Error('Auth not implemented yet'); },
    register: async () => { throw new Error('Auth not implemented yet'); },
    logout: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}