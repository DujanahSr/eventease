package com.eventease.service.export;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.eventease.model.Booking;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ExcelExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm 'WIB'");

    /**
     * Menghasilkan dokumen Excel (.xlsx) profesional berisi laporan penjualan tiket dan data kehadiran peserta.
     * Menggunakan Apache POI dengan styling enterprise: header banner, zebra striping, currency format, dan baris total.
     */
    public byte[] exportBookingsReport(String reportTitle, List<Booking> bookings) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Laporan Penjualan Tiket");
            sheet.setDisplayGridlines(true);

            // Inisialisasi DataFormatter & Helper
            CreationHelper createHelper = workbook.getCreationHelper();
            DataFormat dataFormat = workbook.createDataFormat();

            // Palette Warna Enterprise Modern
            byte[] navyRgb = new byte[]{(byte) 30, (byte) 41, (byte) 59};      // #1E293B
            byte[] blueRgb = new byte[]{(byte) 37, (byte) 99, (byte) 235};     // #2563EB
            byte[] zebraRgb = new byte[]{(byte) 248, (byte) 250, (byte) 252};  // #F8FAFC
            byte[] totalRgb = new byte[]{(byte) 226, (byte) 232, (byte) 240};  // #E2E8F0
            byte[] greenRgb = new byte[]{(byte) 220, (byte) 252, (byte) 231};  // #DCFCE7 (Green 100)
            byte[] amberRgb = new byte[]{(byte) 254, (byte) 243, (byte) 199};  // #FEF3C7 (Amber 100)
            byte[] redRgb = new byte[]{(byte) 254, (byte) 226, (byte) 226};    // #FEE2E2 (Red 100)

            XSSFColor navyColor = new XSSFColor(navyRgb, null);
            XSSFColor blueColor = new XSSFColor(blueRgb, null);
            XSSFColor zebraColor = new XSSFColor(zebraRgb, null);
            XSSFColor totalColor = new XSSFColor(totalRgb, null);

            // ================= 1. STYLES DEFINITION =================
            // Title Style (Row 0)
            CellStyle titleStyle = workbook.createCellStyle();
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Segoe UI");
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setColor(IndexedColors.WHITE.getIndex());
            titleStyle.setFont(titleFont);
            titleStyle.setFillForegroundColor(navyColor);
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Subtitle Style (Row 1)
            CellStyle subTitleStyle = workbook.createCellStyle();
            XSSFFont subTitleFont = workbook.createFont();
            subTitleFont.setFontName("Segoe UI");
            subTitleFont.setFontHeightInPoints((short) 10);
            subTitleFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            subTitleFont.setItalic(true);
            subTitleStyle.setFont(subTitleFont);
            subTitleStyle.setAlignment(HorizontalAlignment.LEFT);
            subTitleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Column Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            XSSFFont headerFont = workbook.createFont();
            headerFont.setFontName("Segoe UI");
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(blueColor);
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(headerStyle, BorderStyle.MEDIUM, IndexedColors.GREY_40_PERCENT.getIndex());

            // Base Font for Data Rows
            Font dataFont = workbook.createFont();
            dataFont.setFontName("Segoe UI");
            dataFont.setFontHeightInPoints((short) 10);

            // Text Cell (Normal & Zebra)
            CellStyle cellText = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.LEFT, null);
            CellStyle cellTextZebra = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.LEFT, zebraColor);

            // Center Cell (No, Date, Status)
            CellStyle cellCenter = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.CENTER, null);
            CellStyle cellCenterZebra = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.CENTER, zebraColor);

            // Number Cell (Qty)
            CellStyle cellNumber = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.RIGHT, null);
            CellStyle cellNumberZebra = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.RIGHT, zebraColor);

            // Currency Cell
            CellStyle cellCurrency = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.RIGHT, null);
            cellCurrency.setDataFormat(dataFormat.getFormat("Rp #,##0"));
            CellStyle cellCurrencyZebra = createBaseCellStyle(workbook, dataFont, HorizontalAlignment.RIGHT, zebraColor);
            cellCurrencyZebra.setDataFormat(dataFormat.getFormat("Rp #,##0"));

            // Status Badge Styles
            CellStyle statusPaidStyle = createStatusBadgeStyle(workbook, dataFont, greenRgb, IndexedColors.DARK_GREEN.getIndex());
            CellStyle statusPendingStyle = createStatusBadgeStyle(workbook, dataFont, amberRgb, IndexedColors.DARK_YELLOW.getIndex());
            CellStyle statusCanceledStyle = createStatusBadgeStyle(workbook, dataFont, redRgb, IndexedColors.DARK_RED.getIndex());

            // Total / Summary Row Style
            CellStyle totalLabelStyle = workbook.createCellStyle();
            Font totalFont = workbook.createFont();
            totalFont.setFontName("Segoe UI");
            totalFont.setBold(true);
            totalFont.setFontHeightInPoints((short) 11);
            totalLabelStyle.setFont(totalFont);
            totalLabelStyle.setFillForegroundColor(totalColor);
            totalLabelStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalLabelStyle.setAlignment(HorizontalAlignment.RIGHT);
            totalLabelStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(totalLabelStyle, BorderStyle.DOUBLE, IndexedColors.GREY_50_PERCENT.getIndex());

            CellStyle totalNumberStyle = workbook.createCellStyle();
            totalNumberStyle.cloneStyleFrom(totalLabelStyle);
            totalNumberStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle totalCurrencyStyle = workbook.createCellStyle();
            totalCurrencyStyle.cloneStyleFrom(totalNumberStyle);
            totalCurrencyStyle.setDataFormat(dataFormat.getFormat("Rp #,##0"));

            // ================= 2. POPULATE HEADER ROWS =================
            // Row 0 & 1: Title Banner
            Row titleRow = sheet.createRow(0);
            titleRow.setHeightInPoints(36);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(reportTitle.toUpperCase());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9));

            // Row 1: Subtitle
            Row subRow = sheet.createRow(1);
            subRow.setHeightInPoints(20);
            Cell subCell = subRow.createCell(0);
            subCell.setCellValue("Waktu Unduh: " + LocalDateTime.now().format(DATE_FORMATTER) + " | Total Transaksi: " + bookings.size() + " Pesanan");
            subCell.setCellStyle(subTitleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 9));

            // Row 2: Empty Spacer
            sheet.createRow(2).setHeightInPoints(10);

            // Row 3: Table Column Headers
            String[] headers = {
                    "No.",
                    "Kode Booking",
                    "Nama Acara",
                    "Kategori Tiket",
                    "Nama Pemesan",
                    "Email Pemesan",
                    "Jumlah Tiket",
                    "Total Biaya",
                    "Status Pesanan",
                    "Tanggal Acara"
            };

            Row headerRow = sheet.createRow(3);
            headerRow.setHeightInPoints(28);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ================= 3. POPULATE DATA ROWS =================
            int rowIndex = 4;
            int rowNumber = 1;
            long totalParticipants = 0;
            double grandTotalRevenue = 0.0;

            for (Booking booking : bookings) {
                Row row = sheet.createRow(rowIndex);
                row.setHeightInPoints(22);
                boolean isZebra = (rowIndex % 2 == 1);

                String eventName = (booking.getTicketCategory() != null && booking.getTicketCategory().getEvent() != null)
                        ? booking.getTicketCategory().getEvent().getName() : "-";
                String tierName = (booking.getTicketCategory() != null) ? booking.getTicketCategory().getName() : "-";
                double tierPrice = (booking.getTicketCategory() != null)
                        ? booking.getTicketCategory().getPrice() : 0.0;
                int participants = booking.getParticipants();
                double totalPrice = tierPrice * participants;

                String userName = (booking.getUser() != null) ? booking.getUser().getName() : "Guest";
                String userEmail = (booking.getUser() != null) ? booking.getUser().getEmail() : "-";
                String eventDate = (booking.getEventDate() != null) ? booking.getEventDate().toString() : "-";

                // Cell 0: No
                Cell c0 = row.createCell(0);
                c0.setCellValue(rowNumber++);
                c0.setCellStyle(isZebra ? cellCenterZebra : cellCenter);

                // Cell 1: Kode Booking
                Cell c1 = row.createCell(1);
                c1.setCellValue(booking.getId());
                c1.setCellStyle(isZebra ? cellTextZebra : cellText);

                // Cell 2: Nama Acara
                Cell c2 = row.createCell(2);
                c2.setCellValue(eventName);
                c2.setCellStyle(isZebra ? cellTextZebra : cellText);

                // Cell 3: Kategori Tiket
                Cell c3 = row.createCell(3);
                c3.setCellValue(tierName);
                c3.setCellStyle(isZebra ? cellTextZebra : cellText);

                // Cell 4: Nama Pemesan
                Cell c4 = row.createCell(4);
                c4.setCellValue(userName);
                c4.setCellStyle(isZebra ? cellTextZebra : cellText);

                // Cell 5: Email Pemesan
                Cell c5 = row.createCell(5);
                c5.setCellValue(userEmail);
                c5.setCellStyle(isZebra ? cellTextZebra : cellText);

                // Cell 6: Jumlah Tiket
                Cell c6 = row.createCell(6);
                c6.setCellValue(participants);
                c6.setCellStyle(isZebra ? cellNumberZebra : cellNumber);

                // Cell 7: Total Biaya
                Cell c7 = row.createCell(7);
                c7.setCellValue(totalPrice);
                c7.setCellStyle(isZebra ? cellCurrencyZebra : cellCurrency);

                // Cell 8: Status Badge
                Cell c8 = row.createCell(8);
                String statusStr = (booking.getStatus() != null) ? booking.getStatus().name() : "PENDING";
                c8.setCellValue(statusStr);
                if (booking.getStatus() == Booking.Status.PAID || booking.getStatus() == Booking.Status.CHECKED_IN) {
                    c8.setCellStyle(statusPaidStyle);
                    grandTotalRevenue += totalPrice;
                } else if (booking.getStatus() == Booking.Status.PENDING || booking.getStatus() == Booking.Status.CONFIRMED) {
                    c8.setCellStyle(statusPendingStyle);
                } else {
                    c8.setCellStyle(statusCanceledStyle);
                }

                // Cell 9: Tanggal Acara
                Cell c9 = row.createCell(9);
                c9.setCellValue(eventDate);
                c9.setCellStyle(isZebra ? cellCenterZebra : cellCenter);

                totalParticipants += participants;
                rowIndex++;
            }

            // ================= 4. SUMMARY / TOTAL ROW =================
            Row totalRow = sheet.createRow(rowIndex);
            totalRow.setHeightInPoints(26);

            for (int col = 0; col <= 5; col++) {
                Cell c = totalRow.createCell(col);
                c.setCellStyle(totalLabelStyle);
            }
            totalRow.getCell(0).setCellValue("TOTAL KESELURUHAN (LUNAS)");
            sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, 5));

            // Total Tiket
            Cell totalQtyCell = totalRow.createCell(6);
            totalQtyCell.setCellValue(totalParticipants);
            totalQtyCell.setCellStyle(totalNumberStyle);

            // Total Pendapatan
            Cell grandTotalCell = totalRow.createCell(7);
            grandTotalCell.setCellValue(grandTotalRevenue);
            grandTotalCell.setCellStyle(totalCurrencyStyle);

            // Remaining cells in total row
            for (int col = 8; col <= 9; col++) {
                Cell c = totalRow.createCell(col);
                c.setCellStyle(totalLabelStyle);
            }

            // ================= 5. AUTO FIT & COLUMN WIDTHS =================
            int[] columnWidths = {
                    8 * 256,   // No.
                    38 * 256,  // Kode Booking
                    30 * 256,  // Nama Acara
                    18 * 256,  // Kategori Tiket
                    22 * 256,  // Nama Pemesan
                    28 * 256,  // Email Pemesan
                    14 * 256,  // Jumlah Tiket
                    20 * 256,  // Total Biaya
                    18 * 256,  // Status
                    16 * 256   // Tanggal Acara
            };

            for (int i = 0; i < columnWidths.length; i++) {
                sheet.setColumnWidth(i, columnWidths[i]);
            }

            // Freeze header rows (baris 0 sampai 3 terkunci saat scroll)
            sheet.createFreezePane(0, 4);

            workbook.write(out);
            log.info("Laporan Excel '{}' berhasil dibuat dengan {} baris data", reportTitle, bookings.size());
            return out.toByteArray();
        }
    }

    private CellStyle createBaseCellStyle(XSSFWorkbook wb, Font font, HorizontalAlignment align, XSSFColor bgColor) {
        CellStyle style = wb.createCellStyle();
        style.setFont(font);
        style.setAlignment(align);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT.getIndex());
        if (bgColor != null) {
            style.setFillForegroundColor(bgColor);
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        return style;
    }

    private CellStyle createStatusBadgeStyle(XSSFWorkbook wb, Font font, byte[] bgRgb, short fontColorIndex) {
        CellStyle style = wb.createCellStyle();
        Font statusFont = wb.createFont();
        statusFont.setFontName(font.getFontName());
        statusFont.setBold(true);
        statusFont.setFontHeightInPoints((short) 9);
        statusFont.setColor(fontColorIndex);

        style.setFont(statusFont);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(new XSSFColor(bgRgb, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        setBorders(style, BorderStyle.THIN, IndexedColors.GREY_25_PERCENT.getIndex());
        return style;
    }

    private void setBorders(CellStyle style, BorderStyle borderStyle, short colorIndex) {
        style.setBorderTop(borderStyle);
        style.setBorderBottom(borderStyle);
        style.setBorderLeft(borderStyle);
        style.setBorderRight(borderStyle);
        style.setTopBorderColor(colorIndex);
        style.setBottomBorderColor(colorIndex);
        style.setLeftBorderColor(colorIndex);
        style.setRightBorderColor(colorIndex);
    }
}
