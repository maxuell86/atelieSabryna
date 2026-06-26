'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  nome: string;
  email: string;
  slug?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, telefone: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      api.setToken(savedToken);
      document.cookie = `token=${savedToken}; path=/; max-age=86400; SameSite=Lax`;
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const data = await api.post<{ access_token: string; user: { id: string; nome: string; email: string } }>('/auth/login', { email, senha });
    setToken(data.access_token);
    setUser(data.user);
    api.setToken(data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
  };

  const register = async (nome: string, email: string, senha: string, telefone: string) => {
    await api.post('/auth/register', { nome, email, senha, telefone });
    await login(email, senha);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
