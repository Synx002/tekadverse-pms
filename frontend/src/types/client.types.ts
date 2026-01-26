export interface Client {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    logo: string | null;
    address: string | null;
    description: string | null;
    created_by: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateClientData {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    logo?: File;
    address?: string;
    description?: string;
}