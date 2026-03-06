package com.barbersuite.backend.web.reports.dto;

import java.util.UUID;

public record BarberSummaryItemResponse(
  UUID barberId,
  String barberName,
  int appointmentsCount,
  int completedCount,
  int noShowCount,
  int bookedMinutes
) {
}
