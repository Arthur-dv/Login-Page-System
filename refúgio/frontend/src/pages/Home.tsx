import { useAuth } from '../hooks/useAuth';
import { navigate } from '../router';
import { Icon } from '../components/Icon';

export function Home() {
  const { user, logout } = useAuth();
  return <section className="home-content" aria-labelledby="page-title">
    <p className="success-label" role="status"><Icon name="check" /> Login realizado com sucesso</p>
    <h1 id="page-title" tabIndex={-1}>Olá, {user?.name}.</h1>
    <p>Respire fundo. Você chegou.</p>
    <button className="logout" onClick={() => { logout(); navigate('/login', true); }}>Sair <Icon name="exit" /></button>
  </section>;
}
