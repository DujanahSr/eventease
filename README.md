# Eventease - Enterprise Decoupled Event Management & Ticketing Platform

[![Eventease CI/CD Pipeline](https://github.com/DujanahSr/eventease/actions/workflows/ci.yml/badge.svg)](https://github.com/DujanahSr/eventease/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6-6DB33F?logo=springsecurity&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?logo=nginx&logoColor=white)
![Swagger](https://img.shields.io/badge/OpenAPI-Swagger%203.0-85EA2D?logo=swagger&logoColor=black)
![JUnit5](https://img.shields.io/badge/Testing-JUnit%205%20%7C%20Mockito-25A162?logo=junit5&logoColor=white)

Eventease adalah platform manajemen event dan *ticketing* skala industri dengan arsitektur **Decoupled Client-Server**:
- **Frontend SPA**: React 18, TypeScript, dan Vite dengan presisi visual 100% (*dark futuristic aesthetic*, kristal melayang, glassmorphism, dan Playfair Display typography).
- **Backend API**: Spring Boot 3.4 (JDK 21) murni REST API berstandar *Stateless JWT*, caching *Redis*, *RabbitMQ message broker*, integrasi *Midtrans Snap*, serta *WebSocket STOMP* untuk notifikasi kehadiran real-time.
- **DevOps**: Orkestrasi multi-kontainer Docker Compose, Nginx Reverse Proxy, dan otomatisasi CI/CD dengan GitHub Actions.

---

## 🏛️ Arsitektur Sistem (Decoupled Microservice-Ready)

```mermaid
graph TD
    Client["Browser Klien / Mobile Device"]
    
    subgraph Gateway["DevOps & Edge Gateway"]
        Nginx["Nginx Reverse Proxy (Port 80)<br/>Gzip, Security Headers, SSL/TLS, Caching"]
    end

    subgraph FrontendApp["Frontend Tier (Port 5173 / Container)"]
        ReactApp["React 18 + TypeScript (Vite)<br/>Context API, Axios Interceptor, SweetAlert2"]
    end

    subgraph BackendApp["Backend Tier: Spring Boot 3.4 (JDK 21)"]
        OpenAPI["Swagger UI / OpenAPI 3.0<br/>(/swagger-ui/index.html)"]
        Sec["Spring Security 6 (Stateless JWT Filter)"]
        REST["REST API Controllers<br/>(Auth, Event, Booking, Wallet, Feedback, Admin)"]
        WS["WebSocket STOMP Broker<br/>(/topic/event/{id}/checkin)"]
        Services["Domain & Application Services<br/>JPA Hibernate, Transactional"]
    end

    subgraph Infrastructure["Infrastructure & Persistence Tier"]
        Postgres[("PostgreSQL 16<br/>ACID Enterprise DB")]
        Redis[("Redis 7<br/>Katalog Cache & Token Blacklist")]
        RabbitMQ{{"RabbitMQ Message Broker<br/>Exchange: eventease.exchange"}}
        Worker["Async Fulfillment Consumer<br/>PDF Ticket & SMTP Email Worker"]
        Midtrans["Payment Gateway<br/>Midtrans Snap Sandbox"]
        Cloudinary["Cloudinary CDN<br/>Poster & Media Storage"]
    end

    Client -->|Port 80 / 443| Nginx
    Nginx -->|Route / | ReactApp
    Nginx -->|Route /api/ | REST
    Nginx -->|Route /ws/ | WS
    Nginx -->|Route /swagger-ui/ | OpenAPI

    ReactApp -->|REST Calls (Bearer JWT)| REST
    ReactApp <-->|Real-Time WS Protocol| WS

    REST --> Sec
    Sec --> Services
    Services --> Postgres
    Services -->|Cache-Aside (TTL 10m)| Redis
    Services -->|Asynchronous Event Queue| RabbitMQ
    RabbitMQ -->|Queue: ticket.fulfillment| Worker
    Worker --> Postgres
    Services -->|Snap Token Request| Midtrans
    Midtrans -->|Webhook Callback| REST
    Services -->|Upload Media| Cloudinary
```

---

## 🌟 Fitur Utama & Keunggulan Rekayasa

### 1. Dokumentasi REST API Interaktif (Swagger / OpenAPI 3.0)
- Dokumentasi interaktif visual diakses langsung melalui:
  - **Swagger UI**: `http://localhost:8081/swagger-ui/index.html` (atau cukup buka `http://localhost:8081/`)
  - **OpenAPI JSON Spec**: `http://localhost:8081/v3/api-docs`
- Dilengkapi skema request/response, metadata status, dan tombol `Authorize` untuk pengujian JWT Bearer Token langsung dari browser.

### 2. Pengujian Unit Komprehensif (JUnit 5 & Mockito)
- Menerapkan metodologi **Unit Testing Standar Industri**:
  - `AuthServiceTest.java`: Pengujian registrasi pengguna, validasi password match, verifikasi enkripsi BCrypt, dan exception handling kredensial salah.
  - `EventApiServiceTest.java`: Pengujian penelusuran katalog multi-filter, pagination, dan pengambilan detail acara.
  - `BookingApiServiceTest.java`: Pengujian validasi kuota tiket, pengurangan stok atomik, pembuatan Snap Token, serta validasi tiket berulang pada gate scanner.
  - `JwtServiceTest.java`: Pengujian enkripsi claims, ekstraksi token, dan masa kedaluwarsa.
- **Hasil:** 16 Tests Run, 0 Failures, 0 Errors (**100% Pass**).

### 3. Otomatisasi DevOps (Docker Compose, Nginx & GitHub Actions)
- **Nginx Reverse Proxy**: Mengarahkan lalu lintas port 80 secara cerdas ke Frontend React SPA dan Backend Spring Boot, mendukung WebSocket upgrading (`Connection: Upgrade`), kompresi Gzip, dan security headers.
- **Docker Compose**: Satu perintah `docker compose up -d` menyalakan 6 kontainer terisolasi: Nginx, Frontend, Backend, PostgreSQL 16, Redis 7, dan RabbitMQ 3.
- **GitHub Actions CI/CD Pipeline** (`.github/workflows/ci.yml`): Setiap push memvalidasi build Java 21, menjalankan seluruh unit test Maven, memeriksa typecheck React TypeScript Vite, serta memvalidasi integritas konfigurasi Docker Compose.

---

## 🛠️ Panduan Menjalankan Proyek

### Opsi 1: Menjalankan Secara Mandiri (Development)

1. **Jalankan Database & Layanan Pendukung:**
   Pastikan PostgreSQL 16 (`localhost:5432`), Redis (`localhost:6379`), dan RabbitMQ (`localhost:5672`) aktif.

2. **Jalankan Backend Spring Boot:**
   ```powershell
   ./mvnw clean spring-boot:run
   ```
   - REST API: `http://localhost:8081/api`
   - Swagger Documentation: `http://localhost:8081/` atau `http://localhost:8081/swagger-ui/index.html`

3. **Jalankan Frontend React Vite:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   - Web App UI: `http://localhost:5173`

---

### Opsi 2: Menjalankan dengan Docker Compose (Production Setup)

```bash
# Build dan jalankan seluruh kontainer secara background
docker compose up -d --build

# Buka di browser:
# http://localhost (Aplikasi Web & Reverse Proxy)
# http://localhost/swagger-ui/index.html (Dokumentasi API)
# http://localhost:15672 (RabbitMQ Dashboard: guest / guest)
```

---

## 🧪 Menjalankan Unit Test (JUnit 5 & Mockito)

```powershell
./mvnw test
```

---

## 👥 Akun Default untuk Demonstrasi

| Role | Email | Password | Hak Akses |
|---|---|---|---|
| **Super Admin** | `dujanah@gmail.com` | `abu12345` | Akses penuh sistem, manajemen pengguna, kelola penarikan dana platform |
| **Organizer** | `organizer@eventease.com` | `organizer123` | Buat acara, kelola tier tiket, QR scanner check-in, penarikan saldo dompet |
| **User / Peserta** | `budi@gmail.com` | `budi123` | Eksplorasi acara, pemesanan tiket, pembayaran Snap, download tiket PDF |

---

## 📄 Lisensi
Hak Cipta &copy; 2026 Abu Dujanah Siregar. Seluruh hak cipta dilindungi.
Proyek ini dibangun sebagai portofolio *Fullstack Software Engineering & Enterprise Architecture*.
