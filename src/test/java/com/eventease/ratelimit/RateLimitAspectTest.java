package com.eventease.ratelimit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.time.Duration;

import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.eventease.exception.RateLimitExceededException;

@ExtendWith(MockitoExtension.class)
class RateLimitAspectTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private RateLimited rateLimited;

    @InjectMocks
    private RateLimitAspect rateLimitAspect;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        request.setRemoteAddr("192.168.1.100");
        response = new MockHttpServletResponse();
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

        lenient().when(rateLimited.key()).thenReturn("booking");
        lenient().when(rateLimited.limit()).thenReturn(5);
        lenient().when(rateLimited.duration()).thenReturn(60);
        lenient().when(rateLimited.message()).thenReturn("Batas transaksi tercapai.");
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Rate Limit: Request dalam batas wajar (< 5) diperbolehkan lolos")
    void testRateLimit_UnderLimit_Success() throws Throwable {
        when(valueOperations.increment(anyString())).thenReturn(1L);
        when(redisTemplate.getExpire(anyString(), any())).thenReturn(60L);
        when(joinPoint.proceed()).thenReturn("SUCCESS");

        Object result = rateLimitAspect.enforceRateLimit(joinPoint, rateLimited);

        assertEquals("SUCCESS", result);
        verify(redisTemplate, times(1)).expire(anyString(), any(Duration.class));
        verify(joinPoint, times(1)).proceed();
        assertEquals("5", response.getHeader("X-RateLimit-Limit"));
        assertEquals("4", response.getHeader("X-RateLimit-Remaining"));
    }

    @Test
    @DisplayName("Rate Limit: Request melebihi batas (> 5) memicu RateLimitExceededException")
    void testRateLimit_ExceedLimit_ThrowsException() throws Throwable {
        when(valueOperations.increment(anyString())).thenReturn(6L);
        when(redisTemplate.getExpire(anyString(), any())).thenReturn(45L);

        RateLimitExceededException exception = assertThrows(RateLimitExceededException.class, () -> {
            rateLimitAspect.enforceRateLimit(joinPoint, rateLimited);
        });

        assertEquals(45L, exception.getRetryAfterSeconds());
        assertTrue(exception.getMessage().contains("Batas transaksi tercapai"));
        verify(joinPoint, never()).proceed();
        assertEquals("0", response.getHeader("X-RateLimit-Remaining"));
    }

    @Test
    @DisplayName("Rate Limit: Fallback Graceful jika Redis down/error tidak memblokir user sah")
    void testRateLimit_RedisDown_GracefulDegradation() throws Throwable {
        when(valueOperations.increment(anyString())).thenThrow(new RuntimeException("Redis connection refused"));
        when(joinPoint.proceed()).thenReturn("SUCCESS_FALLBACK");

        Object result = rateLimitAspect.enforceRateLimit(joinPoint, rateLimited);

        assertEquals("SUCCESS_FALLBACK", result);
        verify(joinPoint, times(1)).proceed();
    }
}
