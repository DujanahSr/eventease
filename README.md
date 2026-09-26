# Eventease - Modern Event Ticketing & Real-Time Check-In Platform

[![Eventease CI Pipeline](https://github.com/DujanahSr/eventease/actions/workflows/ci.yml/badge.svg)](https://github.com/DujanahSr/eventease/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6-6DB33F?logo=springsecurity&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?logo=nginx&logoColor=white)

Eventease adalah platform manajemen event dan *ticketing* modern berarsitektur **Decoupled Monolith** dengan orientasi *production-ready*. Dibangun dengan **Spring Boot 3 (Java 21)** dan **React + TypeScript (Vite)**, platform ini mengintegrasikan antrean pesan asinkron (**RabbitMQ**), caching performa tinggi (**Redis**), komunikasi dua arah real-time (**WebSocket STOMP**), serta infrastruktur containerisasi mandiri (**Docker Compose & Nginx**) yang siap dideploy di Linux VPS.

---

## 🏛️ Arsitektur Sistem

Eventease menerapkan pemisahan tugas (*separation of concerns*) yang bersih antara antarmuka pengguna (Single Page Application) dan mesin bisnis backend:

```mermaid
graph TD
    Client["Client Browser / Mobile<br/>(React 18 + Vite + Tailwind CSS)"]
    Nginx["Nginx Edge Reverse Proxy<br/>(Port 80/443, SSL, Gzip)"]
    
    subgraph CoreBackend["Spring Boot 3.4 Core (JDK 21)"]
        Security["Spring Security 6<br/>Stateless JWT & Refresh Token"]
        REST["REST API Controllers<br/>ApiResponse & Global Exception Handler"]
        WS["WebSocket STOMP Broker<br/>(/topic/event/{id}/checkin)"]
        Services["Domain Services<br/>Booking, Event, Auth, Organizer"]
    end
    
    subgraph DataAndInfra["Infrastructure Layer"]
        MySQL[("MySQL 8.0<br/>ACID Transactions")]
        Redis[("Redis 7<br/>Catalog Cache & Token Blacklist")]
        RabbitMQ{{"RabbitMQ Message Broker<br/>Exchange: eventease.exchange"}}
        Worker["Async Fulfillment Consumer<br/>PDF Ticket & SMTP Email Worker"]
    end

    Client -->|HTTP / REST API & Static Files| Nginx
    Client <-->|WSS STOMP Protocol| Nginx
    Nginx -->|/api/* & /ws/*| CoreBackend
    Nginx -->|/* (Static Assets)| Client
    
    Security --> Redis
    REST --> Services
    Services --> MySQL
    Services -->|Cache-Aside| Redis
    Services -->|Publish Ticket Fulfillment| RabbitMQ
    RabbitMQ -->|Queue: ticket.fulfillment| Worker
    Worker --> MySQL
    Services -->|Broadcast Check-in Event| WS
    WS -.->|Push Notifications| Client
```

---

## 🚀 Fitur Unggulan & Nilai Rekayasa Perangkat Lunak

### 1. Autentikasi Stateless JWT & Redis Blacklist
- Mengimplementasikan **Spring Security 6** murni *stateless* menggunakan standar JWT (HMAC-SHA-512) berumur pendek (15 menit) dan rotasi *Refresh Token* aman (7 hari).
- Endpoint `/api/auth/logout` mendaftarkan token aktif ke **Redis Blacklist** dengan masa kedaluwarsa otomatis (TTL) sesuai sisa umur token, mencegah *replay attack*.

### 2. Antrean Pemrosesan Asinkron (RabbitMQ)
- Pembuatan dokumen e-tiket PDF (OpenPDF + QR code ZXing) dan pengiriman email konfirmasi (SMTP) dialihkan dari siklus request HTTP ke **RabbitMQ background worker** (`ticket.fulfillment.queue`).
- Menghilangkan *latency* saat *checkout* Midtrans sehingga *throughput* server tetap tinggi pada kondisi lonjakan transaksi.
- **Graceful Fallback**: Jika broker RabbitMQ tidak aktif, sistem secara otomatis mengeksekusi proses secara sinkron tanpa menggagalkan transaksi pengguna.

### 3. Caching Katalog & Idempotensi (Redis)
- Endpoint katalog event publik (`/api/events`) diakselerasi dengan strategi **Cache-Aside** Redis berdurasi 10 menit.
- Mekanisme *cache eviction* otomatis membersihkan entri cache saat penyelenggara memperbarui atau menambah event.
- Webhook Midtrans menerapkan verifikasi *SHA-512 Signature Hash* dan penanganan status transaksi yang **idempoten** untuk mencegah duplikasi saldo atau kuota tiket.

### 4. Real-Time Check-In Dashboard (WebSocket STOMP) — *Showstopper Feature*
- Penyelenggara acara (*Organizer*) memiliki akses ke dashboard pantauan langsung kedatangan peserta tanpa perlu melakukan refresh halaman.
- Saat gatekeeper/panitia memindai kode QR tiket di lokasi, backend memvalidasi tiket secara transaksional dan mempublikasikan payload ke topik WebSocket `/topic/event/{id}/checkin`.
- Layar dashboard secara instan memperbarui *live counter* kehadiran dan menampilkan *feed* peserta yang baru masuk secara real-time.

### 5. Decoupled Frontend (React 18 + TypeScript + Vite)
- UI modern dan responsif menggunakan **Tailwind CSS** dengan nuansa elegan (*Dark Slate, Emerald & Indigo Accents*).
- Axios HTTP client terintegrasi dengan *interceptor* otomatis yang menyematkan Bearer Token dan menangani sesi kedaluwarsa.
- Integrasi *Midtrans Snap Popup* langsung pada antarmuka pembelian tiket.
- Pengunduhan langsung e-tiket PDF via REST API streaming.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Backend Runtime** | Java 21 (Eclipse Temurin) | Modern LTS Java |
| **Framework** | Spring Boot 3.4.0 | Core backend framework |
| **Security** | Spring Security 6 & JJWT 0.12.6 | Stateless JWT + Refresh Token |
| **Database** | MySQL 8.0 + Spring Data JPA | Transaksional ACID & Hibernate ORM |
| **Caching** | Redis 7 Alpine | Spring Cache & Token Blacklist |
| **Message Broker** | RabbitMQ 3 Management Alpine | Asynchronous ticket fulfillment |
| **Real-Time** | Spring WebSocket + STOMP | Real-time attendee check-in broadcasting |
| **Frontend** | React 18 + TypeScript + Vite | Decoupled Single Page Application |
| **Styling & Icons** | Tailwind CSS + Lucide React | Modern glassmorphism UI |
| **Reverse Proxy** | Nginx Alpine | SSL termination, reverse proxy, gzip |
| **DevOps** | Docker & Docker Compose | Multi-container production deployment |
| **CI/CD** | GitHub Actions | Automated build and test pipeline |

---

## 📡 Dokumentasi Endpoint REST API Utama

Semua respon REST API dibungkus dalam format terstandarisasi:
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-09-27T06:30:00"
}
```

| Modul | Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Publik | Registrasi akun baru (User/Organizer) |
| **Auth** | `POST` | `/api/auth/login` | Publik | Login & memperoleh JWT token pasang |
| **Auth** | `POST` | `/api/auth/refresh-token`| Publik | Rotasi access token menggunakan refresh token |
| **Auth** | `POST` | `/api/auth/logout` | Authenticated | Logout & memasukkan token ke Redis Blacklist |
| **Event** | `GET` | `/api/events` | Publik | Katalog event dengan filter & paginasi (Redis Cached) |
| **Event** | `GET` | `/api/events/{id}` | Publik | Detail event beserta seluruh tier tiket |
| **Event** | `POST` | `/api/events` | Organizer/Admin | Membuat event baru & mengunggah banner |
| **Booking**| `POST` | `/api/bookings` | User | Membuat pesanan tiket & memicu Snap Midtrans |
| **Booking**| `GET` | `/api/bookings/my-tickets`| User | Riwayat pembelian & daftar e-tiket pengguna |
| **Booking**| `GET` | `/api/bookings/tickets/{id}/pdf` | User | Streaming unduh file e-ticket PDF resmi |
| **Webhook**| `POST` | `/api/webhooks/midtrans` | Publik/Midtrans | Webhook pembayaran idempoten (SHA-512) |
| **Scanner**| `POST` | `/api/scanner/check-in` | Organizer/Admin | Validasi QR & broadcast WebSocket real-time |

---

## ⚡ Panduan Menjalankan Proyek

### Opsi 1: Menjalankan Menggunakan Docker Compose (Direkomendasikan untuk VPS / Production)

Seluruh stack (MySQL, Redis, RabbitMQ, Backend, Frontend, Nginx) telah dikonfigurasikan agar dapat berjalan otomatis dalam satu perintah.

1. **Kloning repositori:**
   ```bash
   git clone https://github.com/DujanahSr/eventease.git
   cd eventease
   ```

2. **Buat file konfigurasi `.env`:**
   ```bash
   cp .env.example .env
   ```
   *Sesuaikan kredensial database, kunci Midtrans, dan email SMTP di dalam berkas `.env`.*

3. **Jalankan seluruh layanan:**
   ```bash
   docker compose up -d --build
   ```

4. **Verifikasi status container:**
   ```bash
   docker compose ps
   ```

5. **Akses antarmuka:**
   - **Frontend & REST API**: `http://localhost` (via Nginx Port 80)
   - **RabbitMQ Dashboard**: `http://localhost:15672` (User: `guest` / Pass: `guest`)

---

### Opsi 2: Menjalankan untuk Pengembangan Lokal (Local Development)

#### Backend (Spring Boot):
1. Pastikan MySQL berjalan pada port `3306` dan buat database `eventease_db`.
2. *(Opsional)* Jalankan Redis (port 6379) dan RabbitMQ (port 5672). Jika tidak ada, sistem akan berjalan normal dengan *in-memory fallback*.
3. Jalankan backend:
   ```bash
   # Windows
   .\mvnw.cmd spring-boot:run

   # Linux/macOS
   ./mvnw spring-boot:run
   ```
   *Backend aktif di `http://localhost:8081`.*

#### Frontend (React + Vite):
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend dev server aktif di `http://localhost:5173` dengan proxy otomatis ke backend.*

---

## 🧪 Continuous Integration (CI)

Proyek ini diproteksi oleh **GitHub Actions CI** (`.github/workflows/ci.yml`) yang berjalan otomatis pada setiap aksi *push* dan *pull request* ke branch `main`:
- Menjalankan pipeline pada runner `ubuntu-latest` dengan Eclipse Temurin JDK 21.
- Menguji kompilasi Maven dan memastikan tidak ada *breaking changes*.
- Menguji build aset statis frontend React TypeScript.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi terbuka [MIT License](LICENSE).
