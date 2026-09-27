import api from './api';
import { ApiResponse, User } from '../types';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponseData> {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponseData> {
    const res = await api.post<ApiResponse<AuthResponseData>>('/auth/register', data);
    return res.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
