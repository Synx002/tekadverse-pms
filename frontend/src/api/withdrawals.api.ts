import { api } from './axios';
import type { ApiResponse } from '../types/api.types';

export interface Withdrawal {
    id: number;
    artist_id: number;
    artist_name?: string;
    artist_email?: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bank_info: {
        bank_name: string;
        bank_account_number: string;
        bank_account_holder: string;
    };
    admin_note: string | null;
    created_at: string;
    updated_at: string;
}

export const withdrawalsApi = {
    request: async (amount: number) => {
        const { data } = await api.post<ApiResponse<null>>('/withdrawals/request', { amount });
        return data;
    },
    getMyWithdrawals: async () => {
        const { data } = await api.get<ApiResponse<Withdrawal[]>>('/withdrawals/my');
        return data;
    },
    getAll: async () => {
        const { data } = await api.get<ApiResponse<Withdrawal[]>>('/withdrawals');
        return data;
    },
    updateStatus: async (id: number, status: string, admin_note?: string) => {
        const { data } = await api.put<ApiResponse<null>>(`/withdrawals/${id}/status`, { status, admin_note });
        return data;
    },
};
