import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Link } from '../router';

export function AuthLayout({ mode, children }: { mode: 'login' | 'register'; children: ReactNode }) {
  const isLogin = mode === 'login';
  return <section className={`auth-card ${isLogin ? '' : 'register-card'}`} aria-labelledby="page-title">
    <div className="card-mark"><Icon name="leaf" /></div>
    <nav className="auth-tabs" aria-label="Autenticação">
      <Link href="/login" aria-current={isLogin ? 'page' : undefined}>Entrar</Link>
      <Link href="/register" aria-current={!isLogin ? 'page' : undefined}>Criar conta</Link>
    </nav>
    <div className="form-intro"><h1 id="page-title" tabIndex={-1}>{isLogin ? 'Bom ter você de volta.' : 'Seu refúgio começa aqui.'}</h1><p>{isLogin ? 'Entre e encontre o seu momento de calma.' : 'Só alguns detalhes para começar.'}</p></div>
    {children}
    <p className="form-footer">{isLogin ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'} <Link href={isLogin ? '/register' : '/login'}>{isLogin ? 'Cadastre-se' : 'Entrar'}</Link></p>
  </section>;
}
