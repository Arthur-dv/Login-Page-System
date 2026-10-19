import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { navigate } from '../router';
import { validateRegister } from '../validation';
import type { FieldErrors } from '../validation';

export function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = { name: name.trim(), email: email.trim().toLowerCase(), password };
    const nextErrors = validateRegister(data, confirmPassword);
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) {
      form.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    pending.current = true;
    setLoading(true);
    try { await register(data); navigate('/login?registered=1', true); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar sua conta.'); }
    finally { pending.current = false; setLoading(false); }
  }

  return <AuthLayout mode="register"><form onSubmit={submit} noValidate>
    <Input id="name" name="name" label="Nome" icon="person" autoComplete="name" placeholder="Como podemos chamar você?" required maxLength={80} value={name} error={errors.name} onChange={event => setName(event.target.value)} />
    <Input id="email" name="email" label="E-mail" type="email" icon="email" autoComplete="email" placeholder="voce@exemplo.com" required value={email} error={errors.email} onChange={event => setEmail(event.target.value)} />
    <Input id="password" name="password" label="Senha" type="password" icon="lock" autoComplete="new-password" placeholder="Crie uma senha" required minLength={8} hint="Pelo menos 8 caracteres." value={password} error={errors.password} onChange={event => setPassword(event.target.value)} />
    <Input id="confirm-password" name="confirmPassword" label="Confirmar senha" type="password" icon="lock" autoComplete="new-password" placeholder="Repita sua senha" required minLength={8} value={confirmPassword} error={errors.confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
    {message && <p className="notice error" role="alert">{message}</p>}
    <Button type="submit" loading={loading} loadingText="Criando conta…">Criar conta <Icon name="arrow" /></Button>
  </form></AuthLayout>;
}
