import { api } from './axios';
import type { ApiResponse } from '../types/api.types';

export interface ArtistEarnings {
    total_earned: number;
    total_paid: number;
    total_pending: number;
}

export interface PayoutItem {
    artist_id: number;
    artist_name: string;
    artist_email: string;
    total_pending: number;
}

export interface PayoutsResponse {
    payouts: PayoutItem[];
    total_to_pay: number;
}

export interface GlobalFinanceStats {
    total_earned: number;
    total_paid: number;
    total_pending: number;
    pending_requests: number;
    pending_requests_amount: number;
}

export const earningsApi = {
    getMyEarnings: async () => {
        const { data } = await api.get<ApiResponse<ArtistEarnings>>('/earnings/my-earnings');
        return data;
    },
    getPayouts: async () => {
        const { data } = await api.get<ApiResponse<PayoutsResponse>>('/earnings/payouts');
        return data;
    },
    getGlobalStats: async () => {
        const { data } = await api.get<ApiResponse<GlobalFinanceStats>>('/earnings/global-stats');
        return data;
    },
};
