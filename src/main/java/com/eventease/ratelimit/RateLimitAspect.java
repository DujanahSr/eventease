package com.eventease.ratelimit;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.eventease.exception.RateLimitExceededException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final StringRedisTemplate stringRedisTemplate;

    @Around("@annotation(rateLimited)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimited rateLimited) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        HttpServletResponse response = attributes.getResponse();

        String clientIp = resolveClientIp(request);
        String clientIdentifier = resolveClientIdentifier(clientIp);
        String redisKey = "rate_limit:" + rateLimited.key() + ":" + clientIdentifier;

        try {
            Long currentCount = stringRedisTemplate.opsForValue().increment(redisKey);

            if (currentCount != null && currentCount == 1L) {
                stringRedisTemplate.expire(redisKey, Duration.ofSeconds(rateLimited.duration()));
            }

            Long ttl = stringRedisTemplate.getExpire(redisKey, TimeUnit.SECONDS);
            long safeTtl = (ttl != null && ttl > 0) ? ttl : rateLimited.duration();

            if (response != null) {
                response.setHeader("X-RateLimit-Limit", String.valueOf(rateLimited.limit()));
                long remaining = Math.max(0, rateLimited.limit() - (currentCount != null ? currentCount : 0));
                response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
                response.setHeader("X-RateLimit-Reset", String.valueOf(safeTtl));
            }

            if (currentCount != null && currentCount > rateLimited.limit()) {
                log.warn("Rate limit [Anti-Bot] terpicu untuk identitas [{}] pada namespace '{}'. Permintaan ke-{}/{}",
                        clientIdentifier, rateLimited.key(), currentCount, rateLimited.limit());
                throw new RateLimitExceededException(rateLimited.message(), safeTtl);
            }

        } catch (RateLimitExceededException ex) {
            throw ex;
        } catch (Exception ex) {
            // Graceful degradation: jika Redis tidak merespons, log peringatan tanpa memblokir pengguna sah
            log.error("Redis Rate Limiter gagal merespons: {}. Melewati verifikasi rate limit secara graceful.", ex.getMessage());
        }

        return joinPoint.proceed();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private String resolveClientIdentifier(String clientIp) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName() + ":" + clientIp;
        }
        return clientIp;
    }
}
