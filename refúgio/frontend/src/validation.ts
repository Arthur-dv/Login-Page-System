import type { LoginRequest, RegisterRequest } from './types/auth';

export type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

export function validateLogin(data: LoginRequest): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.email.trim()) errors.email = 'Informe seu e-mail.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Informe um e-mail válido.';
  if (!data.password) errors.password = 'Informe sua senha.';
  else if (data.password.length < 8) errors.password = 'Use pelo menos 8 caracteres.';
  return errors;
}

export function validateRegister(data: RegisterRequest, confirmPassword: string): FieldErrors {
  const errors = validateLogin(data);
  if (!data.name.trim()) errors.name = 'Informe seu nome.';
  else if (data.name.trim().length > 80) errors.name = 'Use no máximo 80 caracteres.';
  if (!confirmPassword) errors.confirmPassword = 'Confirme sua senha.';
  else if (data.password !== confirmPassword) errors.confirmPassword = 'As senhas devem ser iguais.';
  return errors;
}
