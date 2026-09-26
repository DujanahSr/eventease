package com.eventease.cache;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String BLACKLIST_PREFIX = "token:blacklist:";

    // In-memory fallback jika Redis server offline di lingkungan lokal
    private final Map<String, Long> inMemoryBlacklist = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long remainingTimeMs) {
        if (token == null || token.isBlank()) return;

        long ttl = Math.max(remainingTimeMs, 1000L);

        try {
            String redisKey = BLACKLIST_PREFIX + token;
            redisTemplate.opsForValue().set(redisKey, "revoked", ttl, TimeUnit.MILLISECONDS);
            log.info("Token berhasil dimasukkan ke Redis blacklist. TTL: {} ms", ttl);
        } catch (Exception ex) {
            log.warn("Gagal menyimpan blacklist ke Redis (Redis offline): {}. Menggunakan in-memory fallback.", ex.getMessage());
            inMemoryBlacklist.put(token, System.currentTimeMillis() + ttl);
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) return false;

        try {
            String redisKey = BLACKLIST_PREFIX + token;
            Boolean hasKey = redisTemplate.hasKey(redisKey);
            if (Boolean.TRUE.equals(hasKey)) {
                return true;
            }
        } catch (Exception ex) {
            log.debug("Pemeriksaan Redis blacklist gagal (Redis offline): {}. Mengecek in-memory fallback.", ex.getMessage());
        }

        // Cek in-memory fallback
        Long expiry = inMemoryBlacklist.get(token);
        if (expiry != null) {
            if (System.currentTimeMillis() < expiry) {
                return true;
            } else {
                inMemoryBlacklist.remove(token);
            }
        }

        return false;
    }
}
