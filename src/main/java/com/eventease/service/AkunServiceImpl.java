package com.eventease.service;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.eventease.constant.RoleConstants;
import com.eventease.dto.LoginRequest;
import com.eventease.dto.RegisterRequest;
import com.eventease.model.Akun;
import com.eventease.repository.RoleRepositoy;
import com.eventease.repository.AkunRepository;

@Service
@RequiredArgsConstructor

public class AkunServiceImpl implements AkunService {
    final AkunRepository userRepository;
    final RoleRepositoy roleRepositoy;

    @Override
    public void register(RegisterRequest request) throws Exception {

        if (request.getName() == null || request.getName().trim().length() < 3) {
            throw new Exception("Nama lengkap minimal 3 karakter.");
        }
        if (request.getPhone() == null || !request.getPhone().matches("\\d{10,15}")) {
            throw new Exception("Nomor telepon tidak valid. Harus berupa angka 10-15 digit.");
        }
        if (request.getEmail() == null || !request.getEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new Exception("Format email tidak valid.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new Exception("Password minimal 6 karakter.");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new Exception("Password dan Konfirmasi Password tidak cocok!");
        }

        Akun user = userRepository.findUserByEmail(request.getEmail());
        if (user != null) {
            throw new Exception("Email Sudah Terdaftar");
        } else {
            Akun newUser = new Akun();
            newUser.setName(request.getName());
            newUser.setEmail(request.getEmail());
            newUser.setPhone(request.getPhone());
            
            // Paksa semua pendaftaran baru menjadi USER demi keamanan
            String roleName = RoleConstants.ROLE_USER;
            
            newUser.setRole(roleRepositoy.findRoleByRoleName(roleName));
            newUser.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw(request.getPassword(), org.mindrot.jbcrypt.BCrypt.gensalt()));
            newUser.setConfirmPassword("encrypted");
            userRepository.save(newUser);
        }
    }

    @Override
    public Akun login(LoginRequest request) throws Exception {
        Akun user = userRepository.findUserByEmail(request.getEmail());
        if (user == null) {
            throw new Exception("Email tidak terdaftar. Silakan registrasi.");
        }
    
        if (!org.mindrot.jbcrypt.BCrypt.checkpw(request.getPassword(), user.getPassword())) {
            throw new Exception("Email atau password salah!");
        }
    
        return user;
    }
    

    @Override
    public List<Akun> findAll() {
        return userRepository.findAll();
    }
    @Override
    public Akun findUserByEmail(String email) { 
        return userRepository.findUserByEmail(email);
    }

    @Override
    public Akun findAkunById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    @Override
    public List<Akun> findAllAkun() {
        return userRepository.findAll();
    }
    
    @Override
    public Page<Akun> findAllAkun(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Override
    public void updateProfile(String id, String name, String phone) throws Exception {
        if (name == null || name.trim().length() < 3) {
            throw new Exception("Nama lengkap minimal 3 karakter.");
        }
        if (phone == null || !phone.matches("\\d{10,15}")) {
            throw new Exception("Nomor telepon tidak valid. Harus berupa angka 10-15 digit.");
        }
        
        Akun user = userRepository.findById(id).orElseThrow(() -> new Exception("User tidak ditemukan"));
        user.setName(name);
        user.setPhone(phone);
        userRepository.save(user);
    }

    @Override
    public void updateProfilePicture(String id, String filename) throws Exception {
        Akun user = userRepository.findById(id).orElseThrow(() -> new Exception("User tidak ditemukan"));
        user.setProfilePicture(filename);
        userRepository.save(user);
    }

    @Override
    public void updatePassword(String id, String oldPassword, String newPassword) throws Exception {
        if (newPassword == null || newPassword.length() < 6) {
            throw new Exception("Password baru minimal 6 karakter.");
        }
        
        Akun user = userRepository.findById(id).orElseThrow(() -> new Exception("User tidak ditemukan"));
        
        if (!org.mindrot.jbcrypt.BCrypt.checkpw(oldPassword, user.getPassword())) {
            throw new Exception("Password lama salah!");
        }

        user.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw(newPassword, org.mindrot.jbcrypt.BCrypt.gensalt()));
        userRepository.save(user);
    }

    @Override
    public void updateUserRole(String id, String targetRole) throws Exception {
        Akun user = userRepository.findById(id).orElseThrow(() -> new Exception("User tidak ditemukan"));
        
        // Prevent changing ADMIN
        if (user.getRole().getRoleName().equals(RoleConstants.ROLE_ADMIN)) {
            throw new Exception("Tidak dapat mengubah role ADMIN.");
        }
        
        user.setRole(roleRepositoy.findRoleByRoleName(targetRole));
        userRepository.save(user);
    }

    @Override
    public void saveAkun(Akun akun) {
        if (akun.getPassword() != null && !akun.getPassword().startsWith("$2a$")) {
            akun.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw(akun.getPassword(), org.mindrot.jbcrypt.BCrypt.gensalt()));
            akun.setConfirmPassword("encrypted");
        }
        userRepository.save(akun);
    }

    @Override
    public Akun findAkunByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public java.util.Optional<Akun> findByResetToken(String resetToken) {
        return userRepository.findByResetToken(resetToken);
    }
    
}
