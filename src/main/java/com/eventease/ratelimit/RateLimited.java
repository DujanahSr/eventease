package com.eventease.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotasi Rate Limiting untuk memproteksi endpoint dari spam, serangan bot, dan calo tiket (anti-scalping).
 * Didukung oleh Redis Atomic Increment dengan Sliding Window / Fixed Window TTL.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    /**
     * Kunci namespace operasi, misal "booking", "login", dsb.
     */
    String key() default "default";

    /**
     * Maksimal request yang diperbolehkan dalam jangka waktu tertentu.
     */
    int limit() default 5;

    /**
     * Durasi jendela waktu dalam detik (default 60 detik = 1 menit).
     */
    int duration() default 60;

    /**
     * Pesan kesalahan jika rate limit terlampaui.
     */
    String message() default "Batas transaksi tercapai. Anda hanya dapat melakukan 5 permintaan pemesanan tiket per menit.";
}
