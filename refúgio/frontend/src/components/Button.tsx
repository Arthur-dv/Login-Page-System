import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export function Button({ children, loading = false, loadingText = 'Aguarde…', disabled, className = '', ...props }: ButtonProps) {
  return <button {...props} className={`button ${className}`} disabled={disabled || loading} aria-busy={loading}>
    {loading ? <><span className="spinner" aria-hidden="true" />{loadingText}</> : children}
  </button>;
}
