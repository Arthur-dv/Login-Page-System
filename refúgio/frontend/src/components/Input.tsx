import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  icon: IconName;
}

export function Input({ id, label, error, hint, icon, type = 'text', ...props }: InputProps) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const description = [error ? `${id}-error` : '', hint ? `${id}-hint` : '', props['aria-describedby'] ?? ''].filter(Boolean).join(' ');
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <div className={`input-wrap ${error ? 'input-error' : ''}`}>
      <span className="input-icon"><Icon name={icon} /></span>
      <input {...props} id={id} type={password && visible ? 'text' : type} aria-invalid={Boolean(error)} aria-describedby={description || undefined} />
      {password && <button className="password-toggle" type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name={visible ? 'eye-off' : 'eye'} /></button>}
    </div>
    {hint && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
    {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
  </div>;
}
