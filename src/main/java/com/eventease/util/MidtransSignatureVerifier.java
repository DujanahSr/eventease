package com.eventease.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MidtransSignatureVerifier {

    public static boolean verify(String orderId, String statusCode, String grossAmount, String serverKey, String expectedSignature) {
        if (orderId == null || statusCode == null || grossAmount == null || serverKey == null || expectedSignature == null) {
            return false;
        }

        try {
            String rawString = orderId + statusCode + grossAmount + serverKey.trim();
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] digest = md.digest(rawString.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : digest) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            return hexString.toString().equalsIgnoreCase(expectedSignature.trim());
        } catch (NoSuchAlgorithmException e) {
            log.error("Algoritma SHA-512 tidak tersedia: ", e);
            return false;
        }
    }
}
