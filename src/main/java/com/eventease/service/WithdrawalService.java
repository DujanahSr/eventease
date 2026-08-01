package com.eventease.service;

import com.eventease.model.Akun;
import com.eventease.model.Withdrawal;
import com.eventease.repository.WithdrawalRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final DashboardStatisticsService dashboardStatisticsService;

    public List<Withdrawal> findAll() {
        return withdrawalRepository.findAll();
    }
    
    public Page<Withdrawal> findAll(Pageable pageable) {
        return withdrawalRepository.findAll(pageable);
    }

    public List<Withdrawal> findByOrganizer(Akun organizer) {
        return withdrawalRepository.findByOrganizerOrderByRequestDateDesc(organizer);
    }
    
    public Page<Withdrawal> findByOrganizer(Akun organizer, Pageable pageable) {
        return withdrawalRepository.findByOrganizerOrderByRequestDateDesc(organizer, pageable);
    }

    public Withdrawal findById(String id) {
        return withdrawalRepository.findById(id).orElse(null);
    }

    public Double getAvailableBalance(Akun organizer) {
        Double totalRevenue = dashboardStatisticsService.getTotalRevenueByOrganizer(organizer);
        if (totalRevenue == null) totalRevenue = 0.0;
        
        // POTONGAN KOMISI PLATFORM (5%)
        Double netRevenue = totalRevenue * 0.95; 
        
        Double totalWithdrawn = withdrawalRepository.calculateTotalWithdrawnOrPendingByOrganizer(organizer);
        if (totalWithdrawn == null) totalWithdrawn = 0.0;
        
        return netRevenue - totalWithdrawn;
    }

    public void requestWithdrawal(Akun organizer, Double amount, String bankName, String accountNumber, String accountName) throws Exception {
        Double availableBalance = getAvailableBalance(organizer);
        if (amount <= 0) {
            throw new Exception("Nominal penarikan tidak valid.");
        }
        if (amount > availableBalance) {
            throw new Exception("Saldo tidak mencukupi (Saldo maksimal: Rp " + Math.round(availableBalance) + ").");
        }

        Withdrawal withdrawal = new Withdrawal();
        withdrawal.setOrganizer(organizer);
        withdrawal.setAmount(amount);
        withdrawal.setBankName(bankName);
        withdrawal.setAccountNumber(accountNumber);
        withdrawal.setAccountName(accountName);
        withdrawal.setStatus(Withdrawal.Status.PENDING);
        withdrawal.setRequestDate(LocalDateTime.now());

        withdrawalRepository.save(withdrawal);
    }

    public void approveWithdrawal(String id) {
        Withdrawal withdrawal = findById(id);
        if (withdrawal != null && withdrawal.getStatus() == Withdrawal.Status.PENDING) {
            withdrawal.setStatus(Withdrawal.Status.APPROVED);
            withdrawalRepository.save(withdrawal);
        }
    }

    public void rejectWithdrawal(String id) {
        Withdrawal withdrawal = findById(id);
        if (withdrawal != null && withdrawal.getStatus() == Withdrawal.Status.PENDING) {
            withdrawal.setStatus(Withdrawal.Status.REJECTED);
            withdrawalRepository.save(withdrawal);
        }
    }
}
