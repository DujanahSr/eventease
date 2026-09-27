import api from './api';
import { ApiResponse, PagedResponse, EventSummary, EventDetail, Category } from '../types';

export const eventService = {
  async getEvents(search = '', categoryId = '', page = 0, size = 12): Promise<PagedResponse<EventSummary>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    params.append('page', page.toString());
    params.append('size', size.toString());

    const res = await api.get<ApiResponse<PagedResponse<EventSummary>>>(`/events?${params.toString()}`);
    return res.data.data;
  },

  async getEventById(id: string): Promise<EventDetail> {
    const res = await api.get<ApiResponse<EventDetail>>(`/events/${id}`);
    return res.data.data;
  },

  async getCategories(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  async createEvent(eventData: any): Promise<EventDetail> {
    const res = await api.post<ApiResponse<EventDetail>>('/events', eventData);
    return res.data.data;
  },

  async uploadImage(file: File, folder = 'eventease/events'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await api.post<ApiResponse<{ url: string }>>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  },
};
