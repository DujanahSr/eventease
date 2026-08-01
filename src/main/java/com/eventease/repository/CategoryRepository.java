package com.eventease.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.eventease.model.Category;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByNameContainingIgnoreCase(String name);
    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);

    List<Category> findAllByOrderByDescriptionAsc();
    Page<Category> findAllByOrderByDescriptionAsc(Pageable pageable);

}
