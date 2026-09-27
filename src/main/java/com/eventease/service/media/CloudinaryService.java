package com.eventease.service.media;

import org.springframework.web.multipart.MultipartFile;
import com.eventease.dto.media.UploadResultDto;

public interface CloudinaryService {

    /**
     * Mengunggah berkas gambar ke Cloudinary CDN (atau fallback ke Local Storage).
     *
     * @param file   berkas gambar yang diunggah
     * @param folder folder tujuan (misal: "events", "avatars", "banners")
     * @return UploadResultDto berisi tautan URL publik, public_id, dan metadata
     */
    UploadResultDto uploadImage(MultipartFile file, String folder);

    /**
     * Menghapus gambar dari Cloudinary CDN menggunakan public_id.
     *
     * @param publicId public_id gambar di Cloudinary
     */
    void deleteImage(String publicId);

    /**
     * Memeriksa apakah integrasi Cloudinary aktif dan kredensial valid.
     */
    boolean isCloudinaryConfigured();
}
