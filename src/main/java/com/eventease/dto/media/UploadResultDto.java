package com.eventease.dto.media;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResultDto {
    private String url;
    private String publicId;
    private String format;
    private Long bytes;
    private String originalFilename;
    private String provider; // "CLOUDINARY" atau "LOCAL_STORAGE"
}
