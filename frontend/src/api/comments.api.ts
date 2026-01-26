import { api } from './axios';
import type { Comment, CreateCommentData } from '../types/comment.types';
import type { ApiResponse } from '../types/api.types';

export const commentsApi = {
  getByTaskId: async (taskId: number) => {
    const { data } = await api.get<ApiResponse<Comment[]>>(`/comments/task/${taskId}`);
    return data;
  },

  create: async (commentData: CreateCommentData) => {
    const { data } = await api.post<ApiResponse<Comment>>('/comments', commentData);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse<null>>(`/comments/${id}`);
    return data;
  },
};
