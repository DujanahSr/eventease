package com.eventease.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.eventease.dto.media.UploadResultDto;
import com.eventease.exception.BadRequestException;
import com.eventease.service.media.CloudinaryServiceImpl;

class CloudinaryServiceTest {

    @Test
    @DisplayName("Harus melempar BadRequestException saat berkas kosong")
    void testUploadEmptyFile() {
        CloudinaryServiceImpl service = new CloudinaryServiceImpl(null);
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);

        assertThrows(BadRequestException.class, () -> service.uploadImage(emptyFile, "events"));
    }

    @Test
    @DisplayName("Harus melempar BadRequestException saat format berkas bukan gambar")
    void testUploadInvalidContentType() {
        CloudinaryServiceImpl service = new CloudinaryServiceImpl(null);
        MockMultipartFile pdfFile = new MockMultipartFile("file", "doc.pdf", "application/pdf", "dummy pdf content".getBytes());

        assertThrows(BadRequestException.class, () -> service.uploadImage(pdfFile, "events"));
    }

    @Test
    @DisplayName("Harus berhasil fallback ke Local Storage saat Cloudinary tidak terkonfigurasi")
    void testFallbackToLocalStorage() {
        CloudinaryServiceImpl service = new CloudinaryServiceImpl(null);
        assertFalse(service.isCloudinaryConfigured());

        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "sample-poster.jpg",
                "image/jpeg",
                "dummy image content bytes".getBytes()
        );

        UploadResultDto result = service.uploadImage(imageFile, "events");

        assertNotNull(result);
        assertEquals("LOCAL_STORAGE", result.getProvider());
        assertTrue(result.getUrl().startsWith("/uploads/events/"));
        assertEquals("jpg", result.getFormat());
        assertEquals("sample-poster.jpg", result.getOriginalFilename());
    }

    @Test
    @DisplayName("Harus berhasil upload ke Cloudinary CDN saat kredensial terkonfigurasi")
    void testUploadToCloudinarySuccess() throws IOException {
        Cloudinary mockCloudinary = mock(Cloudinary.class);
        Uploader mockUploader = mock(Uploader.class);
        when(mockCloudinary.uploader()).thenReturn(mockUploader);

        Map<String, Object> mockResponse = Map.of(
                "secure_url", "https://res.cloudinary.com/eventease/image/upload/v12345/events/concert.jpg",
                "public_id", "eventease/events/concert",
                "format", "jpg",
                "bytes", 1024L
        );
        when(mockUploader.upload(any(byte[].class), anyMap())).thenReturn(mockResponse);

        CloudinaryServiceImpl service = new CloudinaryServiceImpl(mockCloudinary);
        assertTrue(service.isCloudinaryConfigured());

        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "concert.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3, 4}
        );

        UploadResultDto result = service.uploadImage(imageFile, "events");

        assertNotNull(result);
        assertEquals("CLOUDINARY", result.getProvider());
        assertEquals("https://res.cloudinary.com/eventease/image/upload/v12345/events/concert.jpg", result.getUrl());
        assertEquals("eventease/events/concert", result.getPublicId());
        assertEquals("jpg", result.getFormat());
    }

    @Test
    @DisplayName("Harus memanggil destroy Cloudinary saat menghapus gambar Cloudinary")
    void testDeleteCloudinaryImage() throws IOException {
        Cloudinary mockCloudinary = mock(Cloudinary.class);
        Uploader mockUploader = mock(Uploader.class);
        when(mockCloudinary.uploader()).thenReturn(mockUploader);

        CloudinaryServiceImpl service = new CloudinaryServiceImpl(mockCloudinary);
        service.deleteImage("eventease/events/sample_id");

        verify(mockUploader).destroy(any(), anyMap());
    }
}
