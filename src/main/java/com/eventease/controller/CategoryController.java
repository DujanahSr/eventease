package com.eventease.controller;

import lombok.RequiredArgsConstructor;

import com.eventease.model.Category;
import com.eventease.service.CategoryService;


import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Controller
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;
    
    @GetMapping
    public String listCategories(@RequestParam(required = false) String search, 
                                 @RequestParam(required = false) String sort,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "10") int size,
                                 Model model) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Category> categoryPage;
        
        if (search != null && !search.isEmpty()) {
            categoryPage = categoryService.searchByName(search, pageable);
        } else if ("description".equals(sort)) {
            categoryPage = categoryService.findAllSortedByDescription(pageable);
        } else {
            categoryPage = categoryService.findAll(pageable);
        }
        
        model.addAttribute("categories", categoryPage.getContent());
        model.addAttribute("categoryPage", categoryPage);
        model.addAttribute("search", search);
        model.addAttribute("sort", sort);
        return "categories";
    }
    @GetMapping("/add")
    public String showAddCategoryForm(Model model) {
        model.addAttribute("category", new Category());
        return "category-form";
    }
    
    @PostMapping
    public String addCategory(@ModelAttribute Category category, Model model) {
        try {
            if (category.getId() == null || category.getId().isEmpty()) {
                category.setId(null); 
            }
            categoryService.save(category);
            return "redirect:/categories";
        } catch (Exception e) {
            model.addAttribute("error", "Failed to save category. " + e.getMessage());
            return "category-form";
        }
    }
    
    @GetMapping("/edit/{id}")
    public String showEditCategoryForm(@PathVariable String id, Model model) {
        Category category = categoryService.findById(id);
        if (category == null) {
            return "redirect:/categories";
        }
        model.addAttribute("category", category);
        return "category-form";
    }

    @PostMapping("/update")
    public String updateCategory(@ModelAttribute Category category) {
        categoryService.save(category);
        return "redirect:/categories";
    }

    @GetMapping("/delete/{id}")
    public String deleteCategory(@PathVariable String id) {
        categoryService.deleteById(id);
        return "redirect:/categories";
    }
}
