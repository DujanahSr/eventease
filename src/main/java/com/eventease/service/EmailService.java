package com.eventease.service;

import java.text.NumberFormat;
import java.util.Locale;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.eventease.model.Booking;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendETicketEmail(Booking booking, byte[] pdfBytes) {
        if (booking == null || booking.getUser() == null || booking.getUser().getEmail() == null) {
            log.warn("Gagal mengirim email: data booking atau user email kosong");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String eventName = booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null
                    ? booking.getTicketCategory().getEvent().getName() : "Eventease Event";

            helper.setFrom("dujanahsr07@gmail.com", "Eventease Ticketing Platform");
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("E-Ticket Resmi Eventease: " + eventName);

            String htmlBody = buildTicketEmailHtml(booking);
            helper.setText(htmlBody, true);

            // Attach PDF ticket
            if (pdfBytes != null && pdfBytes.length > 0) {
                String safeEventName = eventName.replaceAll("[^a-zA-Z0-9.-]", "_");
                helper.addAttachment("Eventease_ETicket_" + safeEventName + ".pdf", new ByteArrayResource(pdfBytes));
            }

            log.info("Memulai pengiriman email e-ticket via SMTP ke {}", booking.getUser().getEmail());
            mailSender.send(message);
            log.info("Email E-Ticket BERHASIL terkirim via SMTP ke {}", booking.getUser().getEmail());
        } catch (Exception e) {
            log.error("Gagal mengirim email e-ticket ke {}: {}", booking.getUser().getEmail(), e.getMessage(), e);
            throw new RuntimeException("Gagal mengirim email e-ticket: " + e.getMessage(), e);
        }
    }

    private String buildTicketEmailHtml(Booking booking) {
        String eventName = booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null
                ? booking.getTicketCategory().getEvent().getName() : "Acara";
        String eventDate = booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null
                ? booking.getTicketCategory().getEvent().getDate() : "-";
        String location = booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null
                ? booking.getTicketCategory().getEvent().getLocation() : "-";
        String categoryName = booking.getTicketCategory() != null ? booking.getTicketCategory().getName() : "Tiket Masuk";
        String userName = booking.getUser().getName();
        String bookingId = booking.getId();
        int quantity = booking.getParticipants() > 0 ? booking.getParticipants() : 1;
        double pricePerTicket = booking.getTicketCategory() != null ? booking.getTicketCategory().getPrice() : 0.0;
        double totalPrice = quantity * pricePerTicket;

        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
        formatter.setMaximumFractionDigits(0);
        String formattedPrice = formatter.format(totalPrice);

        return """
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0616; color: #ffffff; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #140b24; border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 16px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #1f113a, #0b0616); padding: 30px; text-align: center; border-bottom: 2px solid #ffd700; }
                    .logo { font-size: 26px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px; }
                    .logo span { color: #ffd700; }
                    .content { padding: 30px; }
                    .badge { display: inline-block; background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
                    .event-title { font-size: 22px; font-weight: bold; color: #ffd700; margin: 0 0 15px 0; }
                    .ticket-info { background: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 20px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                    .info-label { color: rgba(255, 255, 255, 0.6); }
                    .info-val { font-weight: 600; color: #ffffff; }
                    .qr-section { text-align: center; margin: 25px 0; }
                    .booking-code { font-family: monospace; font-size: 18px; color: #ffd700; letter-spacing: 2px; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: rgba(255, 255, 255, 0.5); border-top: 1px solid rgba(255, 255, 255, 0.1); }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">eventease<span>.</span></div>
                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">Konfirmasi Pemesanan & E-Ticket Resmi</p>
                    </div>
                    <div class="content">
                        <span class="badge">&#10003; PEMBAYARAN BERHASIL</span>
                        <h2 class="event-title">%s</h2>
                        <p style="color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0 0 20px 0;">
                            Halo <strong>%s</strong>, terima kasih telah melakukan pemesanan tiket di Eventease. Tiket elektronik Anda telah terbit dan siap digunakan pada hari acara.
                        </p>
                        
                        <div class="ticket-info">
                            <table width="100%%" cellpadding="6" cellspacing="0" style="color: #ffffff; font-size: 14px;">
                                <tr>
                                    <td style="color: rgba(255,255,255,0.6);">Kode Tiket:</td>
                                    <td align="right"><strong style="color: #ffd700;">%s</strong></td>
                                </tr>
                                <tr>
                                    <td style="color: rgba(255,255,255,0.6);">Jadwal Acara:</td>
                                    <td align="right"><strong>%s</strong></td>
                                </tr>
                                <tr>
                                    <td style="color: rgba(255,255,255,0.6);">Lokasi:</td>
                                    <td align="right"><strong>%s</strong></td>
                                </tr>
                                <tr>
                                    <td style="color: rgba(255,255,255,0.6);">Kategori Tiket:</td>
                                    <td align="right"><strong>%s (%d tiket)</strong></td>
                                </tr>
                                <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
                                    <td style="color: rgba(255,255,255,0.6); padding-top: 12px;">Total Pembayaran:</td>
                                    <td align="right" style="padding-top: 12px;"><strong style="color: #22c55e; font-size: 16px;">%s</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div class="qr-section">
                            <p style="font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 5px;">Tunjukkan file lampiran PDF / QR code ini kepada petugas saat check-in:</p>
                            <div class="booking-code">%s</div>
                        </div>
                    </div>
                    <div class="footer">
                        &copy; 2026 Eventease Ticketing Platform. Seluruh hak cipta dilindungi.<br/>
                        Surat elektronik ini dibuat otomatis oleh sistem. Mohon tidak membalas langsung.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(eventName, userName, bookingId, eventDate, location, categoryName, quantity, formattedPrice, bookingId);
    }
}
