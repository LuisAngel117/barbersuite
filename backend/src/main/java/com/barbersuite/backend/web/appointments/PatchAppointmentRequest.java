package com.barbersuite.backend.web.appointments;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PatchAppointmentRequest(
  String startAtLocal,
  @Min(5) @Max(480) Integer durationMinutes,
  String status,
  String notes
) {
}
