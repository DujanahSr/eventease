package com.eventease.init;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import com.eventease.constant.RoleConstants;
import com.eventease.model.Role;
import com.eventease.model.Akun;
import com.eventease.repository.RoleRepositoy;
import com.eventease.repository.AkunRepository;

@Component
@RequiredArgsConstructor

public class InitialDataLoader implements ApplicationRunner {
    final RoleRepositoy roleRepositoy;
    final AkunRepository userRepository;
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (roleRepositoy.findAll().isEmpty()) {
            Role admin = new Role(null, RoleConstants.ROLE_ADMIN, "Role as Admin (Platform Owner)");
            Role organizer = new Role(null, RoleConstants.ROLE_ORGANIZER, "Role as Event Organizer");
            Role user = new Role(null, RoleConstants.ROLE_USER, "Role as User in Application");
            roleRepositoy.saveAll(List.of(admin, organizer, user));
        } else {
            // Ensure ADMIN exists
            if (roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ADMIN) == null) {
                Role admin = new Role(null, RoleConstants.ROLE_ADMIN, "Role as Admin (Platform Owner)");
                roleRepositoy.save(admin);
            }
        }
        if (userRepository.findAll().isEmpty()) {
            Akun admin = new Akun();
            admin.setEmail("dujanah@gmail.com");
            admin.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw("abu12345", org.mindrot.jbcrypt.BCrypt.gensalt()));
            admin.setRole(roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ADMIN));
            userRepository.save(admin);
        } else {
            // Force upgrade existing dujanah@gmail.com to ADMIN (in case it was SUPER_ADMIN)
            Akun admin = userRepository.findUserByEmail("dujanah@gmail.com");
            if (admin != null && !admin.getRole().getRoleName().equals(RoleConstants.ROLE_ADMIN)) {
                admin.setRole(roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ADMIN));
                userRepository.save(admin);
            }
        }
    }
}
