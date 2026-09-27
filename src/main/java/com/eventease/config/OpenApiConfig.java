package com.eventease.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI eventeaseOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Eventease - Enterprise Event Management & Ticketing REST API")
                        .description("Spesifikasi REST API lengkap untuk platform Eventease, mencakup autentikasi JWT, manajemen acara, tier tiket, transaksi checkout Midtrans, gateway check-in, dan penarikan saldo dompet.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Eventease Engineering Team")
                                .email("support@eventease.com")
                                .url("http://localhost:5173"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Masukkan token akses JWT Anda (tanpa menyertakan awalan 'Bearer ')")));
    }
}
