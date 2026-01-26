// src/types/user.types.ts
export type UserRole = 'admin' | 'manager' | 'artist';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    profile_picture: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    profile_picture?: File;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    profile_picture?: File;
    is_active?: boolean;
}