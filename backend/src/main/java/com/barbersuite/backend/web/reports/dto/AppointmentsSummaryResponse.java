package com.barbersuite.backend.web.reports.dto;

import java.time.LocalDate;

public record AppointmentsSummaryResponse(
  LocalDate from,
  LocalDate to,
  int scheduledCount,
  int checkedInCount,
  int completedCount,
  int cancelledCount,
  int noShowCount,
  int bookedMinutes
) {
}
