package com.eventease.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.eventease.dto.booking.BookingRequestDto;
import com.eventease.dto.booking.BookingResponseDto;
import com.eventease.dto.booking.TicketValidationResponseDto;
import com.eventease.exception.BadRequestException;
import com.eventease.model.Akun;
import com.eventease.model.Booking;
import com.eventease.model.Event;
import com.eventease.model.Role;
import com.eventease.model.TicketCategory;
import com.eventease.repository.BookingRepository;
import com.eventease.repository.PaymentRepository;
import com.eventease.repository.TicketCategoryRepository;
import com.eventease.security.UserPrincipal;
import com.eventease.service.api.BookingApiServiceImpl;
import com.eventease.websocket.service.WebSocketNotificationService;

@ExtendWith(MockitoExtension.class)
class BookingApiServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TicketCategoryRepository ticketCategoryRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private MidtransService midtransService;

    @Mock
    private PdfService pdfService;

    @Mock
    private EmailService emailService;

    @Mock
    private com.eventease.messaging.producer.TicketFulfillmentProducer ticketFulfillmentProducer;

    @Mock
    private WebSocketNotificationService webSocketNotificationService;

    @Mock
    private com.eventease.service.export.ExcelExportService excelExportService;

    @Mock
    private com.eventease.repository.EventRepository eventRepository;

    @InjectMocks
    private BookingApiServiceImpl bookingApiService;

    private Akun dummyUser;
    private Akun dummyOrganizer;
    private Event dummyEvent;
    private TicketCategory dummyTicketCategory;
    private UserPrincipal dummyUserPrincipal;
    private UserPrincipal dummyOrganizerPrincipal;

    @BeforeEach
    void setUp() {
        Role userRole = new Role();
        userRole.setId("role-user");
        userRole.setRoleName("USER");

        Role orgRole = new Role();
        orgRole.setId("role-org");
        orgRole.setRoleName("ORGANIZER");

        dummyUser = new Akun();
        dummyUser.setId("user-101");
        dummyUser.setName("Budi Santoso");
        dummyUser.setEmail("budi@gmail.com");
        dummyUser.setRole(userRole);
        dummyUserPrincipal = UserPrincipal.create(dummyUser);

        dummyOrganizer = new Akun();
        dummyOrganizer.setId("org-202");
        dummyOrganizer.setName("Tech Conference ID");
        dummyOrganizer.setEmail("admin@techconf.id");
        dummyOrganizer.setRole(orgRole);
        dummyOrganizerPrincipal = UserPrincipal.create(dummyOrganizer);

        dummyEvent = new Event();
        dummyEvent.setId("event-99");
        dummyEvent.setName("Jakarta Tech Expo 2026");
        dummyEvent.setOrganizer(dummyOrganizer);

        dummyTicketCategory = new TicketCategory();
        dummyTicketCategory.setId("tier-vip");
        dummyTicketCategory.setName("VIP Access");
        dummyTicketCategory.setPrice(350000.0);
        dummyTicketCategory.setCapacity(100);
        dummyTicketCategory.setAvailableStock(50);
        dummyTicketCategory.setEvent(dummyEvent);
    }

    @Test
    @DisplayName("Pesan Tiket Berhasil: Stok berkurang dan Snap Token digenerate")
    void testCreateBooking_Success() throws Exception {
        BookingRequestDto request = new BookingRequestDto("tier-vip", 2);

        when(ticketCategoryRepository.findById("tier-vip")).thenReturn(Optional.of(dummyTicketCategory));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId("booking-uuid-001");
            return b;
        });
        when(midtransService.getSnapToken(any(Booking.class))).thenReturn("snap-token-xyz");

        BookingResponseDto response = bookingApiService.createBooking(request, dummyUserPrincipal);

        assertNotNull(response);
        assertEquals("booking-uuid-001", response.getId());
        assertEquals("snap-token-xyz", response.getSnapToken());
        assertEquals(48, dummyTicketCategory.getAvailableStock()); // 50 - 2
        verify(ticketCategoryRepository, times(1)).save(dummyTicketCategory);
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("Pesan Tiket Gagal: Jumlah tiket melebihi stok yang tersedia")
    void testCreateBooking_QuotaExceeded_ThrowsBadRequestException() {
        dummyTicketCategory.setAvailableStock(2);
        BookingRequestDto request = new BookingRequestDto("tier-vip", 5);

        when(ticketCategoryRepository.findById("tier-vip")).thenReturn(Optional.of(dummyTicketCategory));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            bookingApiService.createBooking(request, dummyUserPrincipal)
        );

        assertTrue(ex.getMessage().contains("melebihi stok yang tersedia"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Validasi Tiket Gate Scanner: Sukses jika tiket berstatus PAID")
    void testValidateAndCheckInTicket_Success() {
        Booking paidBooking = new Booking();
        paidBooking.setId("booking-valid-01");
        paidBooking.setUser(dummyUser);
        paidBooking.setTicketCategory(dummyTicketCategory);
        paidBooking.setStatus(Booking.Status.PAID);
        paidBooking.setParticipants(1);
        paidBooking.setEventDate(LocalDate.now());

        when(bookingRepository.findById("booking-valid-01")).thenReturn(Optional.of(paidBooking));

        TicketValidationResponseDto result = bookingApiService.validateAndCheckInTicket("booking-valid-01", dummyOrganizerPrincipal);

        assertNotNull(result);
        assertTrue(result.isValid());
        assertEquals("Check-in Berhasil! Tiket valid.", result.getMessage());
        assertEquals(Booking.Status.CHECKED_IN, paidBooking.getStatus());
        verify(bookingRepository, times(1)).save(paidBooking);
        verify(webSocketNotificationService, times(1)).notifyCheckIn(paidBooking);
    }

    @Test
    @DisplayName("Validasi Tiket Gate Scanner: Gagal jika tiket sudah pernah CHECKED_IN")
    void testValidateAndCheckInTicket_AlreadyCheckedIn_ReturnsInvalid() {
        Booking checkedInBooking = new Booking();
        checkedInBooking.setId("booking-used-02");
        checkedInBooking.setUser(dummyUser);
        checkedInBooking.setTicketCategory(dummyTicketCategory);
        checkedInBooking.setStatus(Booking.Status.CHECKED_IN);
        checkedInBooking.setParticipants(1);

        when(bookingRepository.findById("booking-used-02")).thenReturn(Optional.of(checkedInBooking));

        TicketValidationResponseDto result = bookingApiService.validateAndCheckInTicket("booking-used-02", dummyOrganizerPrincipal);

        assertNotNull(result);
        assertFalse(result.isValid());
        assertTrue(result.getMessage().contains("Sudah Check-In"));
        verify(webSocketNotificationService, never()).notifyCheckIn(any());
    }

    @Test
    @DisplayName("Ambil Tiket Saya: Mengembalikan daftar pesanan pengguna")
    void testGetMyBookings_Success() {
        Booking booking = new Booking();
        booking.setId("booking-001");
        booking.setUser(dummyUser);
        booking.setTicketCategory(dummyTicketCategory);
        booking.setStatus(Booking.Status.PAID);
        booking.setParticipants(2);

        when(bookingRepository.findByUser(dummyUser))
                .thenReturn(List.of(booking));

        List<BookingResponseDto> result = bookingApiService.getMyBookings(dummyUserPrincipal);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("booking-001", result.get(0).getId());
        assertEquals("Jakarta Tech Expo 2026", result.get(0).getEventName());
        verify(bookingRepository, times(1)).findByUser(dummyUser);
    }

    @Test
    @DisplayName("Ekspor Excel: Organizer berhasil mengunduh laporan penjualan acaranya")
    void testExportBookingsExcel_OrganizerSuccess() throws Exception {
        Booking booking = new Booking();
        booking.setId("booking-exp-01");
        booking.setUser(dummyUser);
        booking.setTicketCategory(dummyTicketCategory);
        booking.setStatus(Booking.Status.PAID);
        booking.setParticipants(2);

        byte[] fakeExcel = new byte[]{1, 2, 3, 4};

        when(bookingRepository.findByTicketCategoryEventOrganizerOrderByEventDateAsc(dummyOrganizer))
                .thenReturn(List.of(booking));
        when(excelExportService.exportBookingsReport(anyString(), anyList()))
                .thenReturn(fakeExcel);

        byte[] result = bookingApiService.exportBookingsExcel(null, dummyOrganizerPrincipal);

        assertNotNull(result);
        assertEquals(4, result.length);
        verify(bookingRepository, times(1)).findByTicketCategoryEventOrganizerOrderByEventDateAsc(dummyOrganizer);
        verify(excelExportService, times(1)).exportBookingsReport(anyString(), anyList());
    }

    @Test
    @DisplayName("Ekspor Excel: Role USER biasa ditolak dengan ForbiddenException")
    void testExportBookingsExcel_UserForbidden() {
        assertThrows(com.eventease.exception.ForbiddenException.class, () -> {
            bookingApiService.exportBookingsExcel(null, dummyUserPrincipal);
        });
        verify(bookingRepository, never()).findAll();
    }
}
