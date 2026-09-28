import api from './api';
import { ApiResponse, PagedResponse, User, Category } from '../types';

export const adminService = {
  async getAllUsers(page = 0, size = 15): Promise<PagedResponse<User>> {
    const res = await api.get<ApiResponse<PagedResponse<User>>>(`/admin/users?page=${page}&size=${size}`);
    return res.data.data;
  },

  async updateUserRole(userId: string, role: string): Promise<User> {
    const res = await api.put<ApiResponse<User>>(`/admin/users/${userId}/role`, { role });
    return res.data.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/admin/users/${userId}`);
  },

  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const res = await api.post<ApiResponse<Category>>('/categories', data);
    return res.data.data;
  },
};
