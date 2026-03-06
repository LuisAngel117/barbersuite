package com.barbersuite.backend.web.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SalesDailyItemResponse(
  LocalDate date,
  int receiptsCount,
  BigDecimal grossSales,
  BigDecimal taxTotal,
  BigDecimal discountTotal
) {
}
