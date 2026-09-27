import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.data.message || 'Login failed');
  };

  const register = async (data: any): Promise<User> => {
    const response = await api.post('/auth/register', data);
    if (response.data.success && response.data.user) {
      setUser(response.data.user);
      return response.data.user;
    }
    throw new Error(response.data.message || 'Registration failed');
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
