# Eventease

[![Eventease CI Pipeline](https://github.com/DujanahSr/eventease/actions/workflows/ci.yml/badge.svg)](https://github.com/DujanahSr/eventease/actions/workflows/ci.yml)

Eventease adalah platform manajemen dan penjualan tiket acara berbasis web yang dibangun dengan Spring Boot. Sistem ini menyediakan alur kerja yang lengkap bagi penyelenggara untuk mengelola acara, menjual tiket, dan memvalidasi kehadiran menggunakan kode QR, sekaligus memberikan pengalaman pembelian tiket yang mulus bagi pengguna dengan integrasi *payment gateway*.

## Fitur Utama

- **Autentikasi Multi-Peran (Stateless JWT)**: 
  - **User**: Mencari acara, membeli tiket, dan melihat riwayat pembelian.
  - **Organizer**: Membuat/mengelola acara, memindai kode QR peserta, mengelola saldo dan pencairan dana.
  - **Admin**: Memantau sistem, mengelola pengguna, dan menyetujui penarikan dana.
- **RESTful API & Standar Respon Terpusat**: Seluruh endpoint API dilengkapi format respon terstandarisasi (`ApiResponse<T>`) dan penanganan error terpusat (`GlobalExceptionHandler`) dengan Jakarta Validation.
- **Tiket & Integrasi QR**: Pembuatan *e-ticket* otomatis dalam format PDF yang dilengkapi kode QR unik untuk keperluan *check-in*.
- **Payment Gateway**: Terintegrasi dengan Midtrans untuk memproses pembayaran (QRIS, GoPay, Virtual Account).
- **Penyimpanan Media**: Pengunggahan dan penyimpanan gambar ditangani melalui Cloudinary.
- **Notifikasi Email**: Pengiriman email otomatis untuk transaksi dan *e-ticket* menggunakan JavaMailSender dan templat HTML (Thymeleaf).

## Teknologi yang Digunakan

- **Backend**: Java 21, Spring Boot 3, Spring Security 6 (Stateless JWT & Refresh Token), Spring Data JPA, Hibernate
- **Frontend**: HTML5, CSS3, Bootstrap 5, Thymeleaf (Sedang bertransisi ke Decoupled React + TypeScript)
- **Database**: MySQL
- **Integrasi & Tools**: Midtrans API, Cloudinary API, OpenPDF, ZXing (QR Code Scanner), GitHub Actions (CI/CD)

## Persyaratan Sistem

- JDK 21 atau lebih baru
- MySQL Server 8.0+
- Akun Midtrans (untuk *Server Key* dan *Client Key*)
- Akun Cloudinary (untuk penyimpanan gambar)

## Panduan Instalasi Lokal

1. **Kloning Repositori**
   ```bash
   git clone https://github.com/username-anda/eventease.git
   cd eventease
   ```

2. **Konfigurasi Database**
   Buat database MySQL dengan nama `eventease_db`. Sesuaikan kredensial pada berkas `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/eventease_db
   spring.datasource.username=root
   spring.datasource.password=password_anda
   ```

3. **Variabel Lingkungan / Kunci API**
   Konfigurasikan kunci API pihak ketiga Anda di dalam `application.properties`:
   ```properties
   # Midtrans
   midtrans.server.key=kunci_server_midtrans_anda
   midtrans.client.key=kunci_client_midtrans_anda
   midtrans.is.production=false

   # Cloudinary
   cloudinary.cloud_name=nama_cloud_anda
   cloudinary.api_key=api_key_anda
   cloudinary.api_secret=api_secret_anda

   # Konfigurasi Email (SMTP)
   spring.mail.username=email_anda@gmail.com
   spring.mail.password=password_aplikasi_anda
   ```

4. **Jalankan Aplikasi**
   Gunakan Maven *wrapper* untuk mengkompilasi dan menjalankan proyek:
   ```bash
   # Windows
   mvnw.cmd spring-boot:run
   
   # Linux/macOS
   ./mvnw spring-boot:run
   ```

5. **Akses Aplikasi**
   Aplikasi akan berjalan dan dapat diakses melalui `http://localhost:8081`.

## Lisensi
Proyek ini bersifat sumber terbuka (Open-Source) dan didistribusikan di bawah [Lisensi MIT](LICENSE).
