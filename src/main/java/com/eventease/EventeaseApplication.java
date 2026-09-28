package com.eventease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class EventeaseApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventeaseApplication.class, args);
	}

	@Bean
	public CommandLineRunner fixDatabaseSchema(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				// Paksa ubah tipe data status menjadi VARCHAR agar CHECKED_IN bisa disimpan
				jdbcTemplate.execute("ALTER TABLE booking MODIFY status VARCHAR(50)");
				System.out.println("[INFO] Database schema fixed for booking status.");
			} catch (Exception e) {
				System.out.println("[WARN] Database schema fix skipped (maybe already correct).");
			}
		};
	}
}
