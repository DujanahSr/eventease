package com.eventease.controller;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import com.eventease.model.Akun;
import com.eventease.model.Role;
import com.eventease.service.AkunService;
import com.eventease.repository.RoleRepositoy;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class OAuthController {

    private final AkunService akunService;
    private final RoleRepositoy roleRepository;

    @Value("${google.client.id:146370175848-nv395oku7lv35171e8t26011sajhamvp.apps.googleusercontent.com}")
    private String googleClientId;

    @PostMapping("/auth/google")
    public String googleLogin(@RequestParam("credential") String credential, HttpSession session, RedirectAttributes redirectAttributes) {
        try {
            NetHttpTransport transport = new NetHttpTransport();
            GsonFactory jsonFactory = new GsonFactory();
            
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                .setAudience(Collections.singletonList(googleClientId))
                .build();

            // Verify the token
            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken != null) {
                Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                // Check if user exists
                Akun user = akunService.findAkunByEmail(email);
                if (user == null) {
                    // Auto Register
                    user = new Akun();
                    user.setEmail(email);
                    user.setName(name);
                    user.setPhone("");
                    // Generate random password
                    user.setPassword(java.util.UUID.randomUUID().toString());
                    user.setConfirmPassword(user.getPassword());

                    Role userRole = roleRepository.findRoleByRoleName("USER");
                    if (userRole == null) {
                        userRole = new Role();
                        userRole.setRoleName("USER");
                        userRole = roleRepository.save(userRole);
                    }
                    user.setRole(userRole);
                    
                    akunService.saveAkun(user); // Password will be hashed in saveAkun
                }

                // Log the user in
                session.setAttribute("loggedInUser", user);
                return "redirect:/";
            } else {
                redirectAttributes.addFlashAttribute("error", "Invalid ID token.");
                return "redirect:/login";
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Login dengan Google gagal: " + e.getMessage());
            return "redirect:/login";
        }
    }
}
