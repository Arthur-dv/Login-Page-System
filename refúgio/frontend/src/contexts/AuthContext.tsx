import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';
import { authService } from '../services/auth';
import { ApiError, tokenStorage } from '../services/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sessionError: string;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  restore: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const generation = useRef(0);

  const restore = useCallback(async () => {
    const attempt = ++generation.current;
    setLoading(true);
    setSessionError('');
    try {
      if (!tokenStorage.get()) { setUser(null); return; }
      const restoredUser = await authService.me();
      if (attempt === generation.current) setUser(restoredUser);
    } catch (error) {
      if (attempt !== generation.current) return;
      setUser(null);
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) tokenStorage.clear();
      else setSessionError(error instanceof Error ? error.message : 'Não foi possível restaurar sua sessão.');
    } finally {
      if (attempt === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void restore();
    return () => { generation.current++; };
  }, [restore]);

  async function login(data: LoginRequest) {
    const result = await authService.login(data);
    tokenStorage.set(result.token);
    setUser(result.user);
    setSessionError('');
  }

  async function register(data: RegisterRequest) {
    await authService.register(data);
  }

  function logout() {
    generation.current++;
    tokenStorage.clear();
    setUser(null);
    setSessionError('');
    setLoading(false);
  }

  return <AuthContext.Provider value={{ user, loading, sessionError, login, register, logout, restore }}>{children}</AuthContext.Provider>;
}
