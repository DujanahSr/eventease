package com.eventease.service;

import com.eventease.model.Booking;
import com.eventease.util.QrCodeUtil;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfService {

    public byte[] generateTicketPdf(Booking booking) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Portrait standard ticket size, maybe A4 or a custom size. Let's use standard A4
        Document document = new Document(new Rectangle(400, 600));
        PdfWriter.getInstance(document, outputStream);

        document.open();

        // Fonts
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

        // Header
        Paragraph header = new Paragraph("EVENTEASE E-TICKET", titleFont);
        header.setAlignment(Element.ALIGN_CENTER);
        header.setSpacingAfter(20);
        document.add(header);

        // Event Name
        Paragraph eventName = new Paragraph(booking.getTicketCategory().getEvent().getName().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18));
        eventName.setAlignment(Element.ALIGN_CENTER);
        eventName.setSpacingAfter(10);
        document.add(eventName);

        // Ticket Info Table
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        table.setSpacingAfter(10f);

        addCellToTable(table, "Nama Pembeli:", boldFont);
        addCellToTable(table, booking.getUser().getName(), normalFont);

        addCellToTable(table, "Kategori Tiket:", boldFont);
        addCellToTable(table, booking.getTicketCategory().getName(), normalFont);

        addCellToTable(table, "Jumlah Tiket:", boldFont);
        addCellToTable(table, String.valueOf(booking.getParticipants()), normalFont);

        addCellToTable(table, "Tanggal Acara:", boldFont);
        addCellToTable(table, booking.getTicketCategory().getEvent().getDate(), normalFont);

        addCellToTable(table, "Lokasi Acara:", boldFont);
        addCellToTable(table, booking.getTicketCategory().getEvent().getLocation(), normalFont);
        
        addCellToTable(table, "Booking ID:", boldFont);
        addCellToTable(table, booking.getId(), normalFont);

        document.add(table);

        // QR Code
        byte[] qrCodeImage = QrCodeUtil.generateQrCodeImage(booking.getId());
        Image qrImage = Image.getInstance(qrCodeImage);
        qrImage.setAlignment(Element.ALIGN_CENTER);
        qrImage.scaleToFit(150, 150);
        document.add(qrImage);

        // Footer note
        Paragraph footer = new Paragraph("Tunjukkan E-Ticket dan identitas diri saat check-in.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10));
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(20);
        document.add(footer);

        document.close();

        return outputStream.toByteArray();
    }

    private void addCellToTable(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(5);
        table.addCell(cell);
    }
}
