import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../router';
import { validateLogin } from '../validation';
import type { FieldErrors } from '../validation';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const registered = new URLSearchParams(window.location.search).get('registered') === '1';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = { email: email.trim().toLowerCase(), password };
    const nextErrors = validateLogin(data);
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) {
      form.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    pending.current = true;
    setLoading(true);
    try { await login(data); navigate('/home', true); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar.'); }
    finally { pending.current = false; setLoading(false); }
  }

  return <AuthLayout mode="login">
    {registered && <p className="notice success" role="status">Conta criada com sucesso. Agora é só entrar.</p>}
    <form onSubmit={submit} noValidate>
      <Input id="email" name="email" label="E-mail" type="email" icon="email" autoComplete="email" placeholder="voce@exemplo.com" required value={email} error={errors.email} onChange={event => setEmail(event.target.value)} />
      <Input id="password" name="password" label="Senha" type="password" icon="lock" autoComplete="current-password" placeholder="Sua senha" required minLength={8} value={password} error={errors.password} onChange={event => setPassword(event.target.value)} />
      {message && <p className="notice error" role="alert">{message}</p>}
      <Button type="submit" loading={loading} loadingText="Entrando…">Entrar <Icon name="arrow" /></Button>
    </form>
  </AuthLayout>;
}
