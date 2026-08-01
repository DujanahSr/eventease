package com.eventease.service;

import java.util.List;

import com.eventease.dto.LoginRequest;
import com.eventease.dto.RegisterRequest;
import com.eventease.model.Akun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AkunService {
    void register(RegisterRequest request) throws Exception;
    Akun login(LoginRequest request) throws Exception;
    List<Akun> findAll();
    Akun findUserByEmail(String email); 

    Akun findAkunById(String id);
    List<Akun> findAllAkun();
    Page<Akun> findAllAkun(Pageable pageable);

    void updateProfile(String id, String name, String phone) throws Exception;
    void updateProfilePicture(String id, String filename) throws Exception;
    void updatePassword(String id, String oldPassword, String newPassword) throws Exception;
    void updateUserRole(String id, String targetRole) throws Exception;
    
    void saveAkun(Akun akun);
    Akun findAkunByEmail(String email);
    java.util.Optional<Akun> findByResetToken(String resetToken);
}
