/** Auth/user shapes — mirror the backend `/api/v1/auth` responses. */

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string; // 'INSPECTOR' for v1
  createdAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}
