package com.eventease.service;

import com.eventease.model.Booking;
import com.eventease.util.QrCodeUtil;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Base64;
import org.springframework.core.io.ByteArrayResource;

@Service
@RequiredArgsConstructor

public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public void sendETicketEmail(Booking booking, byte[] pdfBytes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Enable multipart mode
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(booking.getUser().getEmail());
            helper.setSubject("E-Ticket Eventease: " + booking.getTicketCategory().getEvent().getName());
            
            // Prepare Thymeleaf context
            Context context = new Context();
            context.setVariable("booking", booking);
            
            // Generate QR Code as Base64
            String qrCodeBase64 = QrCodeUtil.generateQrCodeBase64(booking.getId());
            // No longer needed to pass to context if we use CID, but keep it just in case
            context.setVariable("qrCode", qrCodeBase64);
            
            // Render the HTML template
            String htmlContent = templateEngine.process("ticket-email", context);
            
            // Set HTML content
            helper.setText(htmlContent, true);
            
            // Decode base64 and attach as inline image for Gmail compatibility
            byte[] imageBytes = Base64.getDecoder().decode(qrCodeBase64);
            helper.addInline("qrCodeImage", new ByteArrayResource(imageBytes), "image/jpeg");
            
            // Attach the PDF ticket
            if (pdfBytes != null) {
                helper.addAttachment("E-Ticket_" + booking.getId() + ".pdf", new ByteArrayResource(pdfBytes));
            }
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Gagal mengirim email e-ticket: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
