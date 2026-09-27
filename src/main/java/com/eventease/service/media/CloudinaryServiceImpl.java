package com.eventease.service.media;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.eventease.dto.media.UploadResultDto;
import com.eventease.exception.BadRequestException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/jpg"
    );

    private final Cloudinary cloudinary;

    @Autowired
    public CloudinaryServiceImpl(@Autowired(required = false) Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public boolean isCloudinaryConfigured() {
        return this.cloudinary != null;
    }

    @Override
    public UploadResultDto uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        String sanitizedFolder = (folder != null && !folder.isBlank()) ? folder.trim().toLowerCase() : "general";

        if (isCloudinaryConfigured()) {
            return uploadToCloudinary(file, sanitizedFolder);
        } else {
            return uploadToLocalStorage(file, sanitizedFolder);
        }
    }

    private UploadResultDto uploadToCloudinary(MultipartFile file, String folder) {
        try {
            log.info("Mengunggah berkas '{}' ({} bytes) ke Cloudinary folder 'eventease/{}'...",
                    file.getOriginalFilename(), file.getSize(), folder);

            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "eventease/" + folder,
                    "resource_type", "image"
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");
            String format = (String) uploadResult.get("format");
            Long bytes = uploadResult.get("bytes") instanceof Number
                    ? ((Number) uploadResult.get("bytes")).longValue()
                    : file.getSize();

            log.info("Berhasil mengunggah ke Cloudinary CDN: URL={}, publicId={}", secureUrl, publicId);

            return UploadResultDto.builder()
                    .url(secureUrl)
                    .publicId(publicId)
                    .format(format != null ? format : "jpg")
                    .bytes(bytes)
                    .originalFilename(file.getOriginalFilename())
                    .provider("CLOUDINARY")
                    .build();

        } catch (IOException e) {
            log.error("Gagal mengunggah gambar ke Cloudinary: {}", e.getMessage(), e);
            throw new BadRequestException("Gagal mengunggah gambar ke Cloudinary: " + e.getMessage());
        }
    }

    private UploadResultDto uploadToLocalStorage(MultipartFile file, String folder) {
        try {
            log.info("Cloudinary tidak aktif. Mengunggah ke Local File Storage folder '{}'...", folder);

            Path targetDirectory = Paths.get("uploads", folder);
            if (!Files.exists(targetDirectory)) {
                Files.createDirectories(targetDirectory);
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalName.substring(dotIndex).toLowerCase();
            }

            String cleanBaseName = originalName.substring(0, dotIndex > 0 ? dotIndex : originalName.length())
                    .replaceAll("[^a-zA-Z0-9-_]", "_");
            String uniqueFilename = cleanBaseName + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

            Path targetFilePath = targetDirectory.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetFilePath, StandardCopyOption.REPLACE_EXISTING);

            String localUrl = "/uploads/" + folder + "/" + uniqueFilename;
            log.info("Gambar berhasil disimpan di Local File Storage: {}", localUrl);

            return UploadResultDto.builder()
                    .url(localUrl)
                    .publicId("local_" + folder + "_" + uniqueFilename)
                    .format(extension.replace(".", ""))
                    .bytes(file.getSize())
                    .originalFilename(file.getOriginalFilename())
                    .provider("LOCAL_STORAGE")
                    .build();

        } catch (IOException e) {
            log.error("Gagal menyimpan gambar di Local Storage: {}", e.getMessage(), e);
            throw new BadRequestException("Gagal menyimpan berkas gambar: " + e.getMessage());
        }
    }

    @Override
    public void deleteImage(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        if (isCloudinaryConfigured() && !publicId.startsWith("local_")) {
            try {
                log.info("Menghapus gambar dari Cloudinary CDN: publicId={}", publicId);
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            } catch (IOException e) {
                log.warn("Gagal menghapus gambar dari Cloudinary: {}", e.getMessage());
            }
        } else if (publicId.startsWith("local_")) {
            try {
                String[] parts = publicId.split("_", 3);
                if (parts.length >= 3) {
                    Path filePath = Paths.get("uploads", parts[1], parts[2]);
                    Files.deleteIfExists(filePath);
                    log.info("Gambar lokal dihapus: {}", filePath);
                }
            } catch (Exception e) {
                log.warn("Gagal menghapus berkas gambar lokal: {}", e.getMessage());
            }
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Berkas gambar tidak boleh kosong.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Ukuran gambar melebihi batas maksimal 5 MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Format berkas tidak didukung (" + contentType + "). Harap unggah gambar JPG, PNG, atau WebP.");
        }
    }
}
