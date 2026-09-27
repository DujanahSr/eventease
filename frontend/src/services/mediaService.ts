import api from './api';
import { ApiResponse } from '../types';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  originalFilename: string;
  provider: 'CLOUDINARY' | 'LOCAL_STORAGE';
}

export const mediaService = {
  /**
   * Mengunggah berkas gambar ke Cloudinary CDN atau Local Storage backend.
   */
  async uploadImage(file: File, folder: string = 'general'): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await api.post<ApiResponse<UploadResult>>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  /**
   * Menghapus gambar berdasarkan public_id.
   */
  async deleteImage(publicId: string): Promise<void> {
    await api.delete('/media', {
      params: { publicId },
    });
  },

  /**
   * Mengambil status konfigurasi media storage backend.
   */
  async getStatus(): Promise<{ provider: string; isCloudinaryActive: boolean; maxFileSize: string }> {
    const res = await api.get<ApiResponse<{ provider: string; isCloudinaryActive: boolean; maxFileSize: string }>>('/media/status');
    return res.data.data;
  },
};
