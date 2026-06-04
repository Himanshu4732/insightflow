import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '@insightflow/shared';

// Setup axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user on app load
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.user) {
          setUser(response.data.user);
        }
      } catch (err) {
        // Not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to log in.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/register', { email, name, password });
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to register.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/google', { idToken });
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to log in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
