import { api } from './axios';
import type { ApiResponse } from '../types/api.types';

export interface ArtistEarnings {
    total_earned: number;
    total_paid: number;
    total_pending: number;
}

export interface GlobalFinanceStats {
    total_earned: number;
    total_paid: number;
    total_pending: number;
    pending_requests: number;
    pending_requests_amount: number;
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

export interface PendingTask {
    earning_id: number;
    amount: number;
    earned_at: string;
    task_id: number;
    step_name: string;
    page_name: string;
    project_name: string;
    client_name: string;
}

export interface SpendDataPoint {
    key: string;
    label: string;
    total_spend: number;
    paid_spend: number;
    pending_spend: number;
    task_count: number;
}

export interface SpendAnalyticsSummary {
    total_spend: number;
    paid_spend: number;
    pending_spend: number;
    total_tasks: number;
    average_spend: number;
}

export interface SpendAnalyticsResponse {
    period: 'weekly' | 'monthly' | 'yearly';
    chartData: SpendDataPoint[];
    summary: SpendAnalyticsSummary;
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
    getSpendAnalytics: async (period: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
        const { data } = await api.get<ApiResponse<SpendAnalyticsResponse>>('/earnings/spend-analytics', {
            params: { period }
        });
        return data;
    },
    getMyPendingTasks: async () => {
        const { data } = await api.get<ApiResponse<PendingTask[]>>('/earnings/my-pending-tasks');
        return data;
    },
    getArtistPendingTasks: async (artistId: number) => {
        const { data } = await api.get<ApiResponse<PendingTask[]>>(`/earnings/artist-pending-tasks/${artistId}`);
        return data;
    },
};


