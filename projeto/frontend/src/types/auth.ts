export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse extends User {}
export interface MeResponse extends User {}

export interface ApiErrorResponse {
  message: string;
}
