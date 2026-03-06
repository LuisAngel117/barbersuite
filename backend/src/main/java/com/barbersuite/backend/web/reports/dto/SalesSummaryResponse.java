package com.barbersuite.backend.web.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SalesSummaryResponse(
  LocalDate from,
  LocalDate to,
  String currency,
  int receiptsCount,
  BigDecimal grossSales,
  int voidedCount,
  BigDecimal avgTicket,
  BigDecimal taxTotal,
  BigDecimal discountTotal
) {
}
