import axios from '@/lib/axios';
import { AuthResponse, LoginData, RegisterData, User } from '@/types/user.types';

export const authService = {
  // Kayıt ol
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/auth/register', data);

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  // Giriş yap
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>('/auth/login', data);

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  // Profil bilgisi
  async getProfile(): Promise<User> {
    const response = await axios.get('/auth/profile');
    return response.data.data;
  },

  // Çıkış yap
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/giris';
  },

  // Token var mı kontrol et
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Mevcut kullanıcıyı al
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Admin mi kontrol et
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.userType === 'admin';
  },

  // Token al
  getToken(): string | null {
    return localStorage.getItem('token');
  },
};

export default authService;
