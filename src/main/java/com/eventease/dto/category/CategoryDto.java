package com.eventease.dto.category;

import com.eventease.model.Category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private String id;
    private String name;
    private String description;

    public static CategoryDto fromEntity(Category category) {
        if (category == null) return null;
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .build();
    }
}
