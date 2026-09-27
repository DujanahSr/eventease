package com.eventease.service;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.Event;
import com.eventease.model.TicketCategory;
import com.eventease.service.export.ExcelExportService;

class ExcelExportServiceTest {

    private final ExcelExportService excelExportService = new ExcelExportService();

    @Test
    @DisplayName("Ekspor Excel POI: Berhasil menghasilkan dokumen .xlsx dengan struktur dan header yang valid")
    void testExportBookingsReport_GeneratesValidWorkbook() throws IOException {
        Event event = new Event();
        event.setName("Festival Jazz Nusantara 2026");

        TicketCategory category = new TicketCategory();
        category.setName("VIP Frontrow");
        category.setPrice(1500000.0);
        category.setEvent(event);

        Akun user = new Akun();
        user.setName("Budi Hartono");
        user.setEmail("budi@example.com");

        Booking booking = new Booking();
        booking.setId("BOOK-TEST-999");
        booking.setUser(user);
        booking.setTicketCategory(category);
        booking.setParticipants(3);
        booking.setStatus(Booking.Status.PAID);
        booking.setEventDate(LocalDate.of(2026, 8, 17));

        byte[] xlsxBytes = excelExportService.exportBookingsReport("Laporan Penjualan Tiket Test", List.of(booking));

        assertNotNull(xlsxBytes);
        assertTrue(xlsxBytes.length > 0);

        // Verifikasi bahwa file binary adalah valid XLSX workbook menggunakan Apache POI
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(xlsxBytes))) {
            assertEquals(1, workbook.getNumberOfSheets());
            Sheet sheet = workbook.getSheetAt(0);
            assertNotNull(sheet);

            // Verifikasi baris judul banner
            assertEquals("LAPORAN PENJUALAN TIKET TEST", sheet.getRow(0).getCell(0).getStringCellValue());

            // Verifikasi kolom header
            assertEquals("Kode Booking", sheet.getRow(3).getCell(1).getStringCellValue());
            assertEquals("Nama Acara", sheet.getRow(3).getCell(2).getStringCellValue());

            // Verifikasi data baris 1
            assertEquals("BOOK-TEST-999", sheet.getRow(4).getCell(1).getStringCellValue());
            assertEquals("Festival Jazz Nusantara 2026", sheet.getRow(4).getCell(2).getStringCellValue());
            assertEquals(3, (int) sheet.getRow(4).getCell(6).getNumericCellValue());
            assertEquals(4500000.0, sheet.getRow(4).getCell(7).getNumericCellValue());
        }
    }
}
