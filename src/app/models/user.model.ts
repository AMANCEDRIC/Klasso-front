export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Réponse générique de l'API
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
}

// Réponse de connexion (le token est directement dans data)
export interface LoginResponse {
  status: number;
  message: string;
  data: string; // JWT token
}

// Réponse d'inscription
export interface RegisterResponse {
  status: number;
  message: string;
  data: User | null;
}

// Réponse du profil utilisateur
export interface ProfileResponse {
  status: number;
  message: string;
  data: User | null;
}

// Interface pour la compatibilité avec l'ancien système
export interface AuthResponse {
  user: User;
  token: string;
} 