package com.barbersuite.backend.web.reports.dto;

import java.util.List;

public record BarbersSummaryResponse(
  List<BarberSummaryItemResponse> items
) {
}
