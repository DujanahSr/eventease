package com.eventease.init;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.eventease.constant.RoleConstants;
import com.eventease.model.Akun;
import com.eventease.model.Category;
import com.eventease.model.Event;
import com.eventease.model.Role;
import com.eventease.model.TicketCategory;
import com.eventease.repository.AkunRepository;
import com.eventease.repository.CategoryRepository;
import com.eventease.repository.EventRepository;
import com.eventease.repository.RoleRepositoy;
import com.eventease.repository.TicketCategoryRepository;

@Slf4j
@Component
@RequiredArgsConstructor
public class InitialDataLoader implements ApplicationRunner {

    private final RoleRepositoy roleRepositoy;
    private final AkunRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final EventRepository eventRepository;
    private final TicketCategoryRepository ticketCategoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        // 1. Inisialisasi Role Sistem
        initRoles();

        // 2. Inisialisasi Akun Admin
        initAdminAccount();

        // 3. Inisialisasi Akun Organizer & Data Acara per Kategori
        initSampleEvents();
    }

    private void initRoles() {
        if (roleRepositoy.findAll().isEmpty()) {
            Role admin = new Role(null, RoleConstants.ROLE_ADMIN, "Role as Admin (Platform Owner)");
            Role organizer = new Role(null, RoleConstants.ROLE_ORGANIZER, "Role as Event Organizer");
            Role user = new Role(null, RoleConstants.ROLE_USER, "Role as User in Application");
            roleRepositoy.saveAll(List.of(admin, organizer, user));
            log.info("InitialDataLoader: Berhasil membuat 3 peran default (ADMIN, ORGANIZER, USER).");
        } else {
            if (roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ADMIN) == null) {
                Role admin = new Role(null, RoleConstants.ROLE_ADMIN, "Role as Admin (Platform Owner)");
                roleRepositoy.save(admin);
            }
        }
    }

    private void initAdminAccount() {
        if (userRepository.findAll().isEmpty()) {
            Akun admin = new Akun();
            admin.setName("Administrator Eventease");
            admin.setEmail("dujanah@gmail.com");
            admin.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw("abu12345", org.mindrot.jbcrypt.BCrypt.gensalt()));
            admin.setRole(roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ADMIN));
            userRepository.save(admin);
            log.info("InitialDataLoader: Berhasil membuat akun Admin default (dujanah@gmail.com).");
        } else {
            Akun admin = userRepository.findUserByEmail("dujanah@gmail.com");
            if (admin != null && !admin.getRole().getRoleName().equals(RoleConstants.ROLE_ADMIN)) {
                admin.setRole(roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ADMIN));
                userRepository.save(admin);
            }
        }
    }

    private void initSampleEvents() {
        // Hanya inisialisasi jika katalog event masih kosong
        if (eventRepository.count() > 0) {
            log.info("InitialDataLoader: Katalog acara sudah berisi data ({} acara terdaftar). Lewati seeding acara.", eventRepository.count());
            return;
        }

        log.info("InitialDataLoader: Memulai seeding data kategori dan acara per kategori...");

        // 1. Akun Organizer Default
        Role organizerRole = roleRepositoy.findRoleByRoleName(RoleConstants.ROLE_ORGANIZER);
        Akun organizer = userRepository.findUserByEmail("organizer@eventease.com");
        if (organizer == null) {
            organizer = new Akun();
            organizer.setName("Eventease Official Organizer");
            organizer.setEmail("organizer@eventease.com");
            organizer.setPhone("081298765432");
            organizer.setPassword(org.mindrot.jbcrypt.BCrypt.hashpw("organizer123", org.mindrot.jbcrypt.BCrypt.gensalt()));
            organizer.setRole(organizerRole);
            organizer = userRepository.save(organizer);
        }

        // 2. Kategori Acara
        Category catMusic = getOrCreateCategory("Konser & Musik", "Konser musik langsung, festival panggung, dan tur musisi");
        Category catTech = getOrCreateCategory("Teknologi & AI", "Konferensi teknologi, kecerdasan buatan, cloud computing, dan coding summit");
        Category catBiz = getOrCreateCategory("Bisnis & Startup", "Seminar bisnis, startup pitch, networking investasi, dan digital marketing");
        Category catSport = getOrCreateCategory("Olahraga & Marathon", "Lari marathon, turnamen olahraga, esports, dan festival kebugaran");
        Category catArt = getOrCreateCategory("Seni & Kreatif", "Pameran seni kontemporer, galeri cahaya digital, fotografi, dan teater");
        Category catFood = getOrCreateCategory("Kuliner & Makanan", "Festival kuliner nusantara, bazaar rasa nusantara, dan street food carnival");

        // 3. Event 1: Konser & Musik
        createEventWithTickets(
                "Neon Wave Music Festival 2026",
                "2026-11-20",
                "Festival musik spektakuler outdoor menghadirkan musisi papan atas nasional dan internasional dengan tata panggung audio-visual modern dan atraksi cahaya laser kelas dunia.",
                "Parklands Grounds, Jakarta International Stadium (JIS)",
                "/images/events/soundwave-music.jpg",
                catMusic,
                organizer,
                List.of(
                        new TicketItem("Presale Regular", 250000, 500),
                        new TicketItem("VIP Front Row", 650000, 150)
                )
        );

        // 4. Event 2: Teknologi & AI
        createEventWithTickets(
                "Global Tech & AI Summit 2026",
                "2026-10-15",
                "Konferensi teknologi terbesar yang mengupas masa depan Artificial Intelligence, Autonomous Agents, dan Cloud Computing bersama pakar teknologi dunia dan praktisi industri.",
                "Auditorium Utama ICE BSD City, Tangerang",
                "/images/events/ai-cloud-summit.jpg",
                catTech,
                organizer,
                List.of(
                        new TicketItem("General Admission", 150000, 600),
                        new TicketItem("All-Access Pass (Termasuk Workshop)", 450000, 200)
                )
        );

        // 5. Event 3: Bisnis & Startup
        createEventWithTickets(
                "Venture Growth & Startup Pitch 2026",
                "2026-10-28",
                "Ajang temu eksklusif para founder startup, investor ventura (VC), dan eksekutif bisnis untuk menjalin kemitraan strategis, pendanaan modal awal, dan akselerasi bisnis.",
                "Grand Ballroom The Ritz-Carlton Mega Kuningan, Jakarta",
                "/images/events/startup-pitch.jpg",
                catBiz,
                organizer,
                List.of(
                        new TicketItem("Delegate Ticket", 350000, 250),
                        new TicketItem("VIP Investor & Dinner", 950000, 75)
                )
        );

        // 6. Event 4: Olahraga & Marathon
        createEventWithTickets(
                "Borobudur Heritage Night Marathon 2026",
                "2026-11-05",
                "Lari malam eksotis mengelilingi warisan budaya Candi Borobudur dengan gapura lampu bercahaya spektakuler, live DJ di setiap pos hidrasi, dan medali finisher eksklusif.",
                "Taman Wisata Candi Borobudur, Magelang",
                "/images/events/marathon-run.jpg",
                catSport,
                organizer,
                List.of(
                        new TicketItem("10K Night Run", 200000, 400),
                        new TicketItem("Half Marathon 21K", 350000, 250)
                )
        );

        // 7. Event 5: Seni & Kreatif
        createEventWithTickets(
                "Lumina Art & Light Experience Exhibition",
                "2026-10-22",
                "Pameran seni instalasi cahaya digital dan seni kontemporer interaktif yang memukau indra visual dengan ilusi optik memukau dan teknologi holografis modern.",
                "Museum MACAN Galeri Modern, Jakarta Barat",
                "/images/events/art-light-exhibition.jpg",
                catArt,
                organizer,
                List.of(
                        new TicketItem("Weekday Pass", 75000, 600),
                        new TicketItem("Weekend Fast-Track", 120000, 300)
                )
        );

        // 8. Event 6: Kuliner & Makanan
        createEventWithTickets(
                "Nusantara Culinary & Street Food Carnival",
                "2026-11-12",
                "Karnaval kuliner nusantara terbesar menghadirkan lebih dari 100 tenant kuliner legendaris nusantara dan kuliner fusion kekinian lengkap dengan live music dan cooking demo.",
                "Plaza Parkir Timur Senayan GBK, Jakarta",
                "/images/events/culinary-food-fest.jpg",
                catFood,
                organizer,
                List.of(
                        new TicketItem("Tiket Masuk + Voucher Makan", 50000, 800),
                        new TicketItem("Family Pass (4 Tiket)", 175000, 200)
                )
        );

        log.info("InitialDataLoader: Selesai melakukan seeding 6 acara beserta tier tiket di 6 kategori berbeda.");
    }

    private Category getOrCreateCategory(String name, String description) {
        List<Category> existing = categoryRepository.findByNameContainingIgnoreCase(name);
        if (!existing.isEmpty()) {
            return existing.get(0);
        }
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    private void createEventWithTickets(
            String name,
            String date,
            String description,
            String location,
            String imageUrl,
            Category category,
            Akun organizer,
            List<TicketItem> ticketItems) {

        Event event = new Event();
        event.setName(name);
        event.setDate(date);
        event.setDescription(description);
        event.setLocation(location);
        event.setImageUrl(imageUrl);
        event.setCategory(category);
        event.setOrganizer(organizer);

        Event savedEvent = eventRepository.save(event);

        for (TicketItem item : ticketItems) {
            TicketCategory ticket = new TicketCategory();
            ticket.setEvent(savedEvent);
            ticket.setName(item.name);
            ticket.setPrice(item.price);
            ticket.setCapacity(item.capacity);
            ticket.setAvailableStock(item.capacity);
            ticketCategoryRepository.save(ticket);
        }
    }

    private record TicketItem(String name, double price, int capacity) {}
}
