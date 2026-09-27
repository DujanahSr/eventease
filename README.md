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
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN%20Storage-3448C5?logo=cloudinary&logoColor=white)
![Apache POI](https://img.shields.io/badge/Apache%20POI-Excel%20Export-D22128?logo=apache&logoColor=white)
![Bucket4j](https://img.shields.io/badge/Bucket4j-Rate%20Limiting-orange)
![Swagger](https://img.shields.io/badge/OpenAPI-Swagger%203.0-85EA2D?logo=swagger&logoColor=black)
![JUnit5](https://img.shields.io/badge/Testing-JUnit%205%20%7C%20Mockito-25A162?logo=junit5&logoColor=white)

Eventease adalah platform manajemen event dan *ticketing* skala industri (*enterprise-grade*) dengan arsitektur **Decoupled Client-Server**:
- **Frontend SPA**: React 18, TypeScript, dan Vite dengan estetika visual futuristik (*dark glassmorphism*, tipografi Playfair Display, dan animasi responsif).
- **Backend API**: Spring Boot 3.4 (Temurin JDK 21) berstandar murni *Stateless REST API*, *Spring Security 6 JWT*, caching & rate limiting *Redis*, *RabbitMQ message broker*, pembayaran *Midtrans Snap*, penyimpanan awan *Cloudinary CDN*, serta *WebSocket STOMP* untuk pembaruan kehadiran live.
- **DevOps**: Orkestrasi multi-kontainer Docker Compose, Nginx Reverse Proxy Gateway pada port 80, dan pipeline CI/CD otomatis 100% hijau di GitHub Actions.

---

## 🏛️ Arsitektur Sistem (Decoupled Microservice-Ready)

```mermaid
graph TD
    Client["Browser Klien / Mobile Device"]
    
    subgraph Gateway["DevOps & Edge Gateway"]
        Nginx["Nginx Reverse Proxy (Port 80)<br/>Gzip, Security Headers, Reverse Proxy, WebSockets"]
    end

    subgraph FrontendApp["Frontend Tier: React SPA (Port 80 Internal)"]
        ReactApp["React 18 + TypeScript (Vite)<br/>Context API, Axios Interceptor, SweetAlert2<br/>HTML5-QRCode Scanner, STOMP Client"]
    end

    subgraph BackendApp["Backend Tier: Spring Boot 3.4 (JDK 21)"]
        OpenAPI["OpenAPI 3.0 / Swagger UI<br/>(/swagger-ui/index.html & /v3/api-docs)"]
        Sec["Spring Security 6 (Stateless JWT Filter)"]
        RateLimit["Rate Limiter Filter (Bucket4j Anti-Bot)"]
        REST["REST API Controllers<br/>(Auth, Event, Booking, Media, Scanner, Wallet, Admin)"]
        WS["WebSocket STOMP Broker<br/>(/topic/event/{id}/checkin)"]
        POI["Apache POI Engine<br/>Excel Report Exporter (.xlsx)"]
        Services["Domain & Transactional Services<br/>JPA Hibernate, Spring Cache, Mailer"]
    end

    subgraph Infrastructure["Infrastructure & Persistence Tier"]
        Postgres[("PostgreSQL 16<br/>ACID Enterprise DB")]
        Redis[("Redis 7<br/>Katalog Cache & Token Blacklist")]
        RabbitMQ{{"RabbitMQ Message Broker<br/>Queue: ticket.fulfillment"}}
        Worker["Async Fulfillment Consumer<br/>PDF Ticket Generator & SMTP Email"]
        Midtrans["Payment Gateway<br/>Midtrans Snap Sandbox"]
        Cloudinary["Cloudinary CDN<br/>Cloud Media & Poster Storage"]
    end

    Client -->|HTTP Port 80| Nginx
    Nginx -->|Route / | ReactApp
    Nginx -->|Route /api/ | REST
    Nginx -->|Route /ws/ | WS
    Nginx -->|Route /swagger-ui/ & /v3/api-docs | OpenAPI

    ReactApp -->|REST API Calls (Bearer JWT)| REST
    ReactApp <-->|Real-Time WS STOMP Protocol| WS

    REST --> RateLimit
    RateLimit --> Sec
    Sec --> Services
    Services --> Postgres
    Services -->|Cache-Aside & Blacklist| Redis
    Services -->|Asynchronous Event Queue| RabbitMQ
    RabbitMQ --> Worker
    Worker --> Postgres
    Services -->|Snap Token Request| Midtrans
    Midtrans -->|Webhook Callback| REST
    Services -->|Upload Media CDN| Cloudinary
    Services -->|Streaming .xlsx| POI
```

---

## 🌟 Fitur Unggulan Rekayasa Perangkat Lunak

### 1. Ekspor Laporan Penjualan Excel Berstandar Akuntansi (Apache POI 5.3)
- Endpoint khusus `GET /api/bookings/export/excel` yang menghasilkan file spreadsheet `.xlsx` profesional secara langsung (*streaming output stream* tanpa membebani memori heap).
- Dilengkapi formula otomatis `SUM()`, formatting mata uang rupiah (`Rp #,##0`), header berwarna *Navy Blue* dengan teks tebal putih, perataan sel otomatis, dan auto-sizing kolom data.
- Memberikan ringkasan metrik finansial (total tiket terjual, omzet kotor, potongan platform fee, pendapatan bersih) yang disaring secara otomatis berdasarkan hak akses role (*Organizer* hanya melihat acaranya sendiri, *Admin* melihat seluruh platform).

### 2. Rate Limiting Anti-Bot & Anti-Scalping (Bucket4j + Redis)
- Perlindungan otomatis pada endpoint reservasi/pembelian tiket (`/api/bookings`) dengan algoritma *Token Bucket* (maksimal 5 request per menit per alamat IP).
- Membantu mencegah pembelian massal oleh skrip calo (*ticket bot scalpers*) pada saat *ticket war* konser berlangsung.
- Menyertakan header HTTP standar industri:
  - `X-Rate-Limit-Remaining`: Sisa kuota request yang tersedia pada periode saat ini.
  - `X-Rate-Limit-Retry-After-Seconds`: Detik yang harus ditunggu sebelum kuota dipulihkan.
- Mengembalikan response `429 Too Many Requests` secara elegan dengan pesan kesalahan informatif jika kuota terlampaui.

### 3. Live Gate Scanner QR Code & Realtime STOMP Check-In
- Petugas pintu masuk (*Gate Officer*) dapat memindai tiket peserta melalui 3 metode terintegrasi:
  1. **Pemindai Kamera Langsung**: Menggunakan pustaka *HTML5-QRCode* dengan deteksi frame kamera perangkat secara live.
  2. **Unggah File QR Code**: Pemindaian otomatis dari gambar tiket (JPG/PNG).
  3. **Input Manual**: Pengetikan kode tiket jika barcode rusak.
- **Sinkronisasi Realtime**: Saat tiket berstatus valid dipindai, backend mem-publish event ke WebSocket STOMP topic `/topic/event/{id}/checkin`. Layar dashboard Organizer di tempat lain otomatis memunculkan pop-up toast SweetAlert2 secara live berisi nama peserta, tier tiket, dan jam check-in tanpa perlu me-reload halaman.
- Proteksi anti-tiket ganda: Tiket yang telah dipakai otomatis ditandai *ALREADY CHECKED IN* dan ditolak bila dipindai ulang.

### 4. Penyimpanan Media Hybrid (Cloudinary CDN + Local Fallback)
- Seluruh poster acara dan foto profil pengguna diunggah secara otomatis ke cloud CDN *Cloudinary*.
- Dilengkapi mekanisme fallback transparan ke penyimpanan lokal (`/uploads/**`) apabila kredensial API belum disetel atau jaringan eksternal bermasalah, menjamin keandalan sistem tetap 100%.

### 5. Integrasi Payment Gateway Midtrans Snap & Webhook Otomatis
- Pembuatan token transaksi Snap secara dinamis untuk pembayaran instan melalui QRIS, Virtual Account (BCA, Mandiri, BNI, BRI), dan Kartu Kredit.
- Webhook listener `/api/bookings/midtrans/callback` dengan verifikasi signature hash SHA-512 untuk memvalidasi notifikasi status pembayaran dari server Midtrans secara aman.

### 6. Arsitektur Otentikasi & Keamanan Berlapis (Spring Security 6)
- **Stateless JWT**: Access Token berumur 15 menit dan Refresh Token berumur 7 hari.
- **Token Blacklist**: Penyimpanan token yang telah logout di Redis in-memory hingga masa berlaku aslinya berakhir untuk mencegah *replay attack*.
- **Validasi Registrasi Mendalam**: Formulir pendaftaran dilengkapi kolom Konfirmasi Password dan deteksi error validasi visual per kolom secara presisi.

---

## 📋 Katalog REST API (OpenAPI / Swagger 3.0)

Aplikasi menyediakan dokumentasi OpenAPI interaktif yang dapat diuji langsung dari browser:
- **Swagger UI**: `http://localhost/swagger-ui/index.html` (Port 80) atau `http://localhost:8081/swagger-ui.html`
- **OpenAPI JSON Spec**: `http://localhost/v3/api-docs`

| Modul | Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Publik | Registrasi akun baru (USER / ORGANIZER) |
| **Auth** | `POST` | `/api/auth/login` | Publik | Autentikasi dan penerbitan pasangan JWT token |
| **Auth** | `POST` | `/api/auth/refresh` | Publik | Rotasi access token baru via refresh token |
| **Auth** | `POST` | `/api/auth/logout` | Authenticated | Logout dan memasukkan access token ke Redis blacklist |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Mengambil profil pengguna yang sedang login |
| **Events** | `GET` | `/api/events` | Publik | Katalog acara dengan filter kategori, pencarian, dan pagination |
| **Events** | `GET` | `/api/events/{id}` | Publik | Detail lengkap satu acara dan tier tiket yang tersedia |
| **Events** | `POST` | `/api/events` | ORGANIZER, ADMIN | Publikasi acara baru dan alokasi kuota tiket |
| **Events** | `PUT` | `/api/events/{id}` | ORGANIZER, ADMIN | Pembaruan data acara |
| **Events** | `DELETE`| `/api/events/{id}` | ORGANIZER, ADMIN | Pembatalan atau penghapusan acara |
| **Bookings**| `POST` | `/api/bookings` | USER | Checkout tiket konser (Dilindungi Bucket4j Rate Limiting) |
| **Bookings**| `GET` | `/api/bookings/my` | USER | Riwayat seluruh pemesanan tiket pengguna |
| **Bookings**| `GET` | `/api/bookings/{id}` | Authenticated | Detail transaksi tiket dan status pembayaran |
| **Bookings**| `GET` | `/api/bookings/export/excel` | ORGANIZER, ADMIN | **Download Laporan Penjualan Excel (.xlsx)** |
| **Bookings**| `POST` | `/api/bookings/midtrans/callback` | Publik (Midtrans) | Webhook notifikasi status transaksi Midtrans |
| **Scanner** | `POST` | `/api/scanner/verify` | ORGANIZER, ADMIN | Verifikasi keabsahan QR code tiket |
| **Scanner** | `POST` | `/api/scanner/checkin` | ORGANIZER, ADMIN | Validasi check-in tiket dan pemicu broadcast WebSocket STOMP |
| **Media** | `POST` | `/api/media/upload/image` | ORGANIZER, ADMIN | Upload poster acara ke Cloudinary CDN |
| **Media** | `POST` | `/api/media/profile/photo`| Authenticated | Upload foto avatar profil ke Cloudinary CDN |
| **Wallet** | `GET` | `/api/wallet/balance` | ORGANIZER | Informasi saldo dompet hasil penjualan tiket |
| **Wallet** | `POST` | `/api/wallet/withdraw` | ORGANIZER | Pengajuan penarikan dana ke rekening bank |
| **Admin** | `GET` | `/api/admin/users` | ADMIN | Manajemen seluruh pengguna dan perubahan role |
| **Admin** | `POST` | `/api/admin/withdrawals/{id}/approve` | ADMIN | Persetujuan transfer penarikan dana organizer |

---

## 🚀 Panduan Menjalankan Sistem

### Opsi 1: Menjalankan Full-Stack dengan Docker Compose (Direkomendasikan)

Seluruh 6 kontainer (Nginx, React Frontend, Spring Boot Backend, PostgreSQL 16, Redis 7, RabbitMQ 3) dikonfigurasi siap jalan dengan **satu perintah**:

```bash
# Build dan jalankan seluruh 6 container di background
docker compose up -d --build
```

Setelah kontainer aktif, akses layanan berikut:
- **Aplikasi Web Utama (React SPA)**: [http://localhost](http://localhost) (Port 80)
- **Swagger UI API Documentation**: [http://localhost/swagger-ui/index.html](http://localhost/swagger-ui/index.html)
- **OpenAPI 3.0 JSON Spec**: [http://localhost/v3/api-docs](http://localhost/v3/api-docs)
- **RabbitMQ Management Dashboard**: [http://localhost:15672](http://localhost:15672) *(User: `guest` | Pass: `guest`)*

Untuk mematikan seluruh layanan:
```bash
docker compose down
```

---

### Opsi 2: Mode Local Development

1. **Jalankan Database & Layanan Pendukung:**
   Pastikan PostgreSQL 16 (`localhost:5432`) dan Redis 7 (`localhost:6379`) aktif pada sistem lokal Anda.

2. **Jalankan Backend Spring Boot:**
   ```powershell
   # Windows PowerShell
   .\mvnw.cmd spring-boot:run
   ```
   Backend aktif di: `http://localhost:8081`

3. **Jalankan Frontend React SPA:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   Frontend aktif di: `http://localhost:5173`

---

## 🧪 Pengujian Unit & Otomasi CI/CD

### 1. Menjalankan Unit & Integration Tests (JUnit 5 & Mockito)
Proyek ini dilengkapi cakupan unit test komprehensif tanpa ketergantungan jaringan eksternal:
```powershell
.\mvnw.cmd test
```
**Hasil Pengujian:**
```
[INFO] Tests run: 28, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```
- `AuthServiceTest`: Pengujian alur registrasi, enkripsi password BCrypt, rotasi token, dan penanganan kredensial tidak valid.
- `EventApiServiceTest`: Pengujian pencarian multi-kategori, pagination, dan kalkulasi sisa tiket.
- `BookingApiServiceTest`: Pengujian validasi kuota tiket atomik, pembuatan Snap token, dan penolakan tiket kedaluwarsa.
- `JwtServiceTest`: Pengujian keabsahan claims, masa kedaluwarsa, dan tanda tangan digital HMAC SHA-512.
- `RateLimiterFilterTest`: Pengujian pencegahan serangan bot (maksimal 5 request per menit).

### 2. GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)
Workflow otomatis berjalan pada setiap *push* atau *pull request* ke branch `main`:
1. **`backend-ci`**: Menjalankan Temurin JDK 21 di Ubuntu, memverifikasi 28 unit test dengan database PostgreSQL & Redis terisolasi di runner, dan mem-package production JAR artifact.
2. **`frontend-ci`**: Menjalankan Node.js 20, menginstal paket NPM, memeriksa *TypeScript typecheck* (`tsc`), dan memvalidasi *Vite production build*.
3. **`devops-ci`**: Memvalidasi seluruh sintaks deklarasi layanan kontainer pada `docker-compose.yml`.

---

## 👥 Akun Demonstrasi Default

| Role | Nama Pengguna | Email | Password | Hak Akses Utama |
|---|---|---|---|---|
| **Super Admin** | Administrator Eventease | `dujanah@gmail.com` | `abu12345` | Akses penuh manajemen pengguna, monitoring seluruh penjualan tiket, persetujuan penarikan dana platform. |
| **Organizer** | Festival Nusantara Organizer | `organizer@eventease.com` | `organizer123` | Pembuatan acara, pengaturan kuota tiket, QR Gate Scanner live, download laporan penjualan Excel (.xlsx), penarikan saldo dompet. |
| **User / Peserta** | Budi Santoso | `budi@gmail.com` | `budi123` | Penelusuran katalog acara, pembelian tiket (Midtrans Snap), riwayat tiket, unduh e-tiket PDF. |

---

## 📄 Lisensi & Hak Cipta
Hak Cipta &copy; 2026 Abu Dujanah Siregar. Seluruh hak cipta dilindungi undang-undang.  
Dikembangkan sebagai portofolio rekayasa perangkat lunak berskala *Enterprise Fullstack Software Engineering & Cloud Infrastructure*.
