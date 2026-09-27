package com.eventease.dto.wallet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletSummaryDto {
    private Double grossRevenue;
    private Double platformFee;
    private Double netRevenue;
    private Double availableBalance;
}
