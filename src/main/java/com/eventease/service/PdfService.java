package com.eventease.service;

import com.eventease.model.Booking;
import com.eventease.util.QrCodeUtil;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@Service
public class PdfService {

    private static final Color COLOR_PRIMARY_DARK = new Color(11, 6, 22);       // #0B0616
    private static final Color COLOR_GOLD = new Color(255, 215, 0);             // #FFD700
    private static final Color COLOR_GOLD_MUTED = new Color(180, 130, 20);      // Gold dark
    private static final Color COLOR_TEXT_DARK = new Color(15, 23, 42);         // #0F172A
    private static final Color COLOR_TEXT_MUTED = new Color(100, 116, 139);     // #64748B
    private static final Color COLOR_BG_LIGHT = new Color(248, 250, 252);       // #F8FAFC
    private static final Color COLOR_BG_CARD = new Color(255, 255, 255);        // #FFFFFF
    private static final Color COLOR_BORDER = new Color(226, 232, 240);         // #E2E8F0
    private static final Color COLOR_GREEN = new Color(22, 163, 74);            // #16A34A

    public byte[] generateTicketPdf(Booking booking) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Standard A4 portrait with clean 32pt margins
        Document document = new Document(PageSize.A4, 32, 32, 32, 32);
        PdfWriter.getInstance(document, outputStream);

        document.open();

        // Safe Fallbacks
        String eventName = (booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null)
                ? booking.getTicketCategory().getEvent().getName() : "Eventease Exclusive Event";
        String eventDate = (booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null)
                ? booking.getTicketCategory().getEvent().getDate() : "Akan Diumumkan";
        String eventLocation = (booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null)
                ? booking.getTicketCategory().getEvent().getLocation() : "Venue Utama Acara";
        String categoryName = (booking.getTicketCategory() != null)
                ? booking.getTicketCategory().getName() : "GENERAL PASS";
        String buyerName = (booking.getUser() != null && booking.getUser().getName() != null)
                ? booking.getUser().getName() : "Pemegang Tiket";
        String buyerEmail = (booking.getUser() != null && booking.getUser().getEmail() != null)
                ? booking.getUser().getEmail() : "-";
        int quantity = booking.getParticipants() > 0 ? booking.getParticipants() : 1;
        double price = (booking.getTicketCategory() != null) ? booking.getTicketCategory().getPrice() : 0.0;
        double totalPrice = quantity * price;

        NumberFormat idrFormat = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
        idrFormat.setMaximumFractionDigits(0);
        String formattedTotal = idrFormat.format(totalPrice);

        String passCode = (booking.getId() != null && booking.getId().length() >= 8)
                ? booking.getId().substring(0, 8).toUpperCase() : "PASS-ENTRY";

        // Fonts
        Font fontBrand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, COLOR_GOLD);
        Font fontSubBrand = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(226, 213, 181));
        Font fontPassCode = FontFactory.getFont(FontFactory.COURIER_BOLD, 15, COLOR_GOLD);
        Font fontBadge = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_GREEN);
        
        Font fontEventCategory = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_GOLD_MUTED);
        Font fontEventTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, COLOR_TEXT_DARK);
        
        Font fontLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_TEXT_MUTED);
        Font fontValue = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, COLOR_TEXT_DARK);
        Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, COLOR_TEXT_DARK);
        Font fontMono = FontFactory.getFont(FontFactory.COURIER, 8, COLOR_TEXT_MUTED);
        Font fontPrice = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_GREEN);

        Font fontStubTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_TEXT_DARK);
        Font fontInstruction = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_TEXT_MUTED);
        Font fontFooter = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_TEXT_MUTED);

        // ═══════════════════════════════════════════════════════════════
        // 1. TOP HEADER BANNER (Midnight Black & Gold Accent)
        // ═══════════════════════════════════════════════════════════════
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{65, 35});

        PdfPCell headerLeft = new PdfPCell();
        headerLeft.setBackgroundColor(COLOR_PRIMARY_DARK);
        headerLeft.setPadding(14);
        headerLeft.setBorder(Rectangle.NO_BORDER);

        Paragraph pBrand = new Paragraph("EVENTEASE.", fontBrand);
        Paragraph pSub = new Paragraph("OFFICIAL ELECTRONIC ENTRY PASS / E-TICKET", fontSubBrand);
        headerLeft.addElement(pBrand);
        headerLeft.addElement(pSub);
        headerTable.addCell(headerLeft);

        PdfPCell headerRight = new PdfPCell();
        headerRight.setBackgroundColor(COLOR_PRIMARY_DARK);
        headerRight.setPadding(14);
        headerRight.setHorizontalAlignment(Element.ALIGN_RIGHT);
        headerRight.setBorder(Rectangle.NO_BORDER);

        Paragraph pPassLabel = new Paragraph("PASS CODE GERBANG:", fontSubBrand);
        pPassLabel.setAlignment(Element.ALIGN_RIGHT);
        Paragraph pPassVal = new Paragraph(passCode, fontPassCode);
        pPassVal.setAlignment(Element.ALIGN_RIGHT);
        Paragraph pStatus = new Paragraph("STATUS: LUNAS (TERVERIFIKASI)", fontBadge);
        pStatus.setAlignment(Element.ALIGN_RIGHT);

        headerRight.addElement(pPassLabel);
        headerRight.addElement(pPassVal);
        headerRight.addElement(pStatus);
        headerTable.addCell(headerRight);

        document.add(headerTable);

        // Gold Accent Divider Line
        PdfPTable goldLine = new PdfPTable(1);
        goldLine.setWidthPercentage(100);
        PdfPCell lineCell = new PdfPCell();
        lineCell.setBackgroundColor(COLOR_GOLD);
        lineCell.setFixedHeight(3f);
        lineCell.setBorder(Rectangle.NO_BORDER);
        goldLine.addCell(lineCell);
        goldLine.setSpacingAfter(12f);
        document.add(goldLine);

        // ═══════════════════════════════════════════════════════════════
        // 2. EVENT TITLE & VENUE CARD
        // ═══════════════════════════════════════════════════════════════
        PdfPTable eventCard = new PdfPTable(1);
        eventCard.setWidthPercentage(100);
        
        PdfPCell eventCell = new PdfPCell();
        eventCell.setBackgroundColor(COLOR_BG_LIGHT);
        eventCell.setBorderColor(COLOR_BORDER);
        eventCell.setBorderWidth(1f);
        eventCell.setPadding(14);

        Paragraph pCategory = new Paragraph("TIER RESERVASI: " + categoryName.toUpperCase(), fontEventCategory);
        Paragraph pEventTitle = new Paragraph(eventName, fontEventTitle);
        pEventTitle.setSpacingAfter(8f);

        eventCell.addElement(pCategory);
        eventCell.addElement(pEventTitle);

        // Mini Table for Schedule & Venue
        PdfPTable subMeta = new PdfPTable(2);
        subMeta.setWidthPercentage(100);
        subMeta.setWidths(new float[]{45, 55});

        PdfPCell cellDate = new PdfPCell();
        cellDate.setBackgroundColor(COLOR_BG_CARD);
        cellDate.setBorderColor(COLOR_BORDER);
        cellDate.setPadding(8);
        cellDate.addElement(new Paragraph("JADWAL PELAKSANAAN", fontLabel));
        cellDate.addElement(new Paragraph(eventDate, fontValue));
        subMeta.addCell(cellDate);

        PdfPCell cellVenue = new PdfPCell();
        cellVenue.setBackgroundColor(COLOR_BG_CARD);
        cellVenue.setBorderColor(COLOR_BORDER);
        cellVenue.setPadding(8);
        cellVenue.addElement(new Paragraph("LOKASI / VENUE ACARA", fontLabel));
        cellVenue.addElement(new Paragraph(eventLocation, fontValue));
        subMeta.addCell(cellVenue);

        eventCell.addElement(subMeta);
        eventCard.addCell(eventCell);
        eventCard.setSpacingAfter(12f);
        document.add(eventCard);

        // ═══════════════════════════════════════════════════════════════
        // 3. TICKET HOLDER DETAILS & QR PASS STUB (2 COLUMNS)
        // ═══════════════════════════════════════════════════════════════
        PdfPTable mainStubTable = new PdfPTable(2);
        mainStubTable.setWidthPercentage(100);
        mainStubTable.setWidths(new float[]{62, 38});

        // Left Side: Booking & Holder Information
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBackgroundColor(COLOR_BG_CARD);
        leftCell.setBorderColor(COLOR_BORDER);
        leftCell.setBorderWidth(1f);
        leftCell.setPadding(12);

        PdfPTable infoGrid = new PdfPTable(2);
        infoGrid.setWidthPercentage(100);
        infoGrid.setWidths(new float[]{40, 60});

        addInfoRow(infoGrid, "Pemegang Tiket", buyerName, fontLabel, fontValue);
        addInfoRow(infoGrid, "Email Akun", buyerEmail, fontLabel, fontNormal);
        addInfoRow(infoGrid, "Kategori Pass", categoryName, fontLabel, fontValue);
        addInfoRow(infoGrid, "Jumlah Peserta", quantity + " Kursi / Pax", fontLabel, fontValue);
        addInfoRow(infoGrid, "Total Transaksi", formattedTotal + " (LUNAS)", fontLabel, fontPrice);
        addInfoRow(infoGrid, "Booking ID", booking.getId(), fontLabel, fontMono);

        leftCell.addElement(infoGrid);
        mainStubTable.addCell(leftCell);

        // Right Side: QR Code Pass & Gate Scanner Stub
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBackgroundColor(COLOR_BG_LIGHT);
        rightCell.setBorderColor(COLOR_BORDER);
        rightCell.setBorderWidth(1f);
        rightCell.setPadding(10);
        rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pGateTitle = new Paragraph("SCANNER GERBANG", fontStubTitle);
        pGateTitle.setAlignment(Element.ALIGN_CENTER);
        rightCell.addElement(pGateTitle);

        Paragraph pGateSub = new Paragraph("Scan QR saat check-in di venue", fontInstruction);
        pGateSub.setAlignment(Element.ALIGN_CENTER);
        pGateSub.setSpacingAfter(6f);
        rightCell.addElement(pGateSub);

        // QR Code Image
        byte[] qrCodeImage = QrCodeUtil.generateQrCodeImage(booking.getId());
        if (qrCodeImage != null) {
            Image qrImage = Image.getInstance(qrCodeImage);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.scaleToFit(115, 115);
            rightCell.addElement(qrImage);
        }

        Paragraph pStubCode = new Paragraph(passCode, fontPassCode);
        pStubCode.setAlignment(Element.ALIGN_CENTER);
        pStubCode.setSpacingBefore(4f);
        rightCell.addElement(pStubCode);

        Paragraph pVerifyOk = new Paragraph("BERLAKU SATU KALI MASUK", fontBadge);
        pVerifyOk.setAlignment(Element.ALIGN_CENTER);
        rightCell.addElement(pVerifyOk);

        mainStubTable.addCell(rightCell);
        mainStubTable.setSpacingAfter(12f);
        document.add(mainStubTable);

        // ═══════════════════════════════════════════════════════════════
        // 4. IMPORTANT ADMISSION INSTRUCTIONS
        // ═══════════════════════════════════════════════════════════════
        PdfPTable termsTable = new PdfPTable(1);
        termsTable.setWidthPercentage(100);

        PdfPCell termsCell = new PdfPCell();
        termsCell.setBackgroundColor(COLOR_BG_LIGHT);
        termsCell.setBorderColor(COLOR_BORDER);
        termsCell.setBorderWidth(1f);
        termsCell.setPadding(9);

        Paragraph pTermsHeader = new Paragraph("PETUNJUK MASUK & KETENTUAN RESMI PENYELENGGARA:", fontLabel);
        pTermsHeader.setSpacingAfter(4f);
        termsCell.addElement(pTermsHeader);

        String termsText = "1. Tunjukkan dokumen E-Ticket ini (dalam bentuk cetak atau layar smartphone) beserta kartu identitas resmi (KTP/SIM/Paspor) kepada panitia gerbang.\n"
                + "2. Kode QR bersifat unik dan terenkripsi, hanya dapat divalidasi satu kali saat check-in di gerbang acara menggunakan scanner resmi Eventease.\n"
                + "3. Dilarang menduplikasi, memindahtangankan tanpa konfirmasi resmi, atau mempublikasikan kode QR tiket ke media sosial guna menghindari penyalahgunaan.\n"
                + "4. Penyelenggara berhak menolak akses jika kode QR telah digunakan sebelumnya atau status pembayaran belum terselesaikan.";

        Paragraph pTermsContent = new Paragraph(termsText, fontInstruction);
        pTermsContent.setLeading(9.5f);
        termsCell.addElement(pTermsContent);

        termsTable.addCell(termsCell);
        termsTable.setSpacingAfter(10f);
        document.add(termsTable);

        // ═══════════════════════════════════════════════════════════════
        // 5. FOOTER
        // ═══════════════════════════════════════════════════════════════
        SimpleDateFormat sdf = new SimpleDateFormat("dd MMMM yyyy HH:mm", new Locale("id", "ID"));
        String printTimestamp = sdf.format(new Date());

        Paragraph pFooter = new Paragraph("Dokumen resmi diterbitkan oleh Eventease Ticketing Platform (" + printTimestamp + " WIB) | Dilindungi Enkripsi Digital QR Gate Verification | Hak Cipta 2026 Eventease.", fontFooter);
        pFooter.setAlignment(Element.ALIGN_CENTER);
        document.add(pFooter);

        document.close();

        return outputStream.toByteArray();
    }

    private void addInfoRow(PdfPTable table, String label, String value, Font fontLabel, Font fontVal) {
        PdfPCell cellLbl = new PdfPCell(new Paragraph(label, fontLabel));
        cellLbl.setBorder(Rectangle.BOTTOM);
        cellLbl.setBorderColor(new Color(241, 245, 249));
        cellLbl.setPaddingTop(4f);
        cellLbl.setPaddingBottom(4f);

        PdfPCell cellV = new PdfPCell(new Paragraph(value != null ? value : "-", fontVal));
        cellV.setBorder(Rectangle.BOTTOM);
        cellV.setBorderColor(new Color(241, 245, 249));
        cellV.setPaddingTop(4f);
        cellV.setPaddingBottom(4f);

        table.addCell(cellLbl);
        table.addCell(cellV);
    }
}
