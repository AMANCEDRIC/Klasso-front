export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 