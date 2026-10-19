import { api } from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, MeResponse } from '../types/auth';

export const authService = {
  login: (body: LoginRequest) => api<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: RegisterRequest) => api<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<MeResponse>('/auth/me'),
};
