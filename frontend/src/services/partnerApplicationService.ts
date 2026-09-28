import api from './api';
import { ApiResponse, PagedResponse } from '../types';

export interface PartnerApplicationRequest {
  organizationName: string;
  idCardNumber: string;
  idCardImage: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  reason?: string;
}

export interface PartnerApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  organizationName: string;
  idCardNumber: string;
  idCardImage: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const partnerApplicationService = {
  async submit(data: PartnerApplicationRequest): Promise<PartnerApplication> {
    const res = await api.post<ApiResponse<PartnerApplication>>('/partner-applications', data);
    return res.data.data;
  },

  async getMyApplication(): Promise<PartnerApplication | null> {
    const res = await api.get<ApiResponse<PartnerApplication | null>>('/partner-applications/my');
    return res.data.data;
  },

  async getAllApplications(status = 'ALL', page = 0, size = 10): Promise<PagedResponse<PartnerApplication>> {
    const res = await api.get<ApiResponse<PagedResponse<PartnerApplication>>>(
      `/admin/partner-applications?status=${status}&page=${page}&size=${size}`
    );
    return res.data.data;
  },

  async countPending(): Promise<number> {
    const res = await api.get<ApiResponse<{ pendingCount: number }>>('/admin/partner-applications/count-pending');
    return res.data.data.pendingCount;
  },

  async review(id: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<PartnerApplication> {
    const res = await api.put<ApiResponse<PartnerApplication>>(`/admin/partner-applications/${id}/review`, {
      status,
      adminNotes,
    });
    return res.data.data;
  },
};
