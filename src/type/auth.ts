// types/auth.ts
import { User } from './user';

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}