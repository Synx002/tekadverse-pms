import type { User, UserRole } from './user.types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    token: string;
    user: User;
}