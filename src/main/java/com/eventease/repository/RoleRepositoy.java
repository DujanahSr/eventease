package com.eventease.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.eventease.model.Role;

public interface RoleRepositoy extends JpaRepository<Role, String>{
    Role findRoleByRoleName(String roleName);
}
