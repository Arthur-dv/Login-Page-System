import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Redirect } from '../router';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Restaurando sua sessão…</p>;
  return user ? children : <Redirect to="/login" />;
}
