import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Redirect, useLocation } from './router';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Icon } from './components/Icon';
import { Button } from './components/Button';

export function App() {
  const location = useLocation();
  const path = location.split('?')[0];
  const { user, loading, sessionError, restore, logout } = useAuth();
  const home = path === '/home' && Boolean(user);

  useEffect(() => {
    document.title = `Refúgio · ${path === '/register' ? 'Criar conta' : home ? 'Bem-vindo' : 'Entrar'}`;
    document.getElementById('page-title')?.focus({ preventScroll: true });
  }, [location, loading, home]);

  let content;
  if (loading) content = <div className="session-state" role="status"><span className="spinner" /> Restaurando sua sessão…</div>;
  else if (sessionError) content = <section className="auth-card session-state"><p className="notice error" role="alert">{sessionError}</p><Button onClick={() => void restore()}>Tentar novamente</Button><button className="text-button" onClick={logout}>Voltar ao login</button></section>;
  else if (path === '/login' || path === '/register') content = user ? <Redirect to="/home" /> : path === '/login' ? <Login /> : <Register />;
  else if (path === '/home') content = <ProtectedRoute><Home /></ProtectedRoute>;
  else content = <Redirect to={user ? '/home' : '/login'} />;

  return <div className={`app-shell ${home ? 'is-home' : ''}`}>
    <div className="backdrop" aria-hidden="true" />
    <header className="site-header"><span className="brand"><Icon name="leaf" /> refúgio<span className="brand-dot">.</span></span><span className="header-note">UM MOMENTO PARA VOCÊ</span></header>
    <main>{content}</main>
    <footer className="site-footer"><span>Desconecte do ruído. Reconecte com você.</span><span>FEITO PARA IR COM CALMA</span></footer>
  </div>;
}
