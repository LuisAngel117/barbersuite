package com.barbersuite.backend.web.reports.dto;

import java.util.List;

public record SalesDailyResponse(
  String currency,
  List<SalesDailyItemResponse> items
) {
}
