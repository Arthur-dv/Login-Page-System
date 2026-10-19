import type { ApiErrorResponse } from '../types/auth';

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const tokenKey = 'refugio.token';

export const tokenStorage = {
  get: () => localStorage.getItem(tokenKey),
  set: (token: string) => localStorage.setItem(tokenKey, token),
  clear: () => localStorage.removeItem(tokenKey),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function isErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const token = tokenStorage.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar. Verifique se o servidor está disponível.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, isErrorResponse(body) ? body.message : 'Não foi possível concluir a solicitação.');
  }
  if (body === null) throw new ApiError(502, 'O servidor enviou uma resposta inválida.');
  return body as T;
}
