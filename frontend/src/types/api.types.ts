export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}