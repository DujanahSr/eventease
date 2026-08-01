package com.eventease.service;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Category;
import com.eventease.repository.CategoryRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor

public class CategoryService {
    private final CategoryRepository categoryRepository;

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category findById(String id) {
        return categoryRepository.findById(id).orElse(null);
    }

    public Category save(Category category) {
        System.out.println("Saving category: " + category);
        return categoryRepository.save(category);
    }

    public void deleteById(String id) {
        categoryRepository.deleteById(id);
    }

    public List<Category> searchByName(String name) {
        return categoryRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Page<Category> searchByName(String name, Pageable pageable) {
        return categoryRepository.findByNameContainingIgnoreCase(name, pageable);
    }
    
    public List<Category> findAllSortedByDescription() {
        return categoryRepository.findAllByOrderByDescriptionAsc();
    }
    
    public Page<Category> findAllSortedByDescription(Pageable pageable) {
        return categoryRepository.findAllByOrderByDescriptionAsc(pageable);
    }
    
    public Page<Category> findAll(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }
}
