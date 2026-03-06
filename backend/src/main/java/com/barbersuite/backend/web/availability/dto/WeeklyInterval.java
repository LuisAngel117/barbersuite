package com.barbersuite.backend.web.availability.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WeeklyInterval(
  @NotNull @Min(1) @Max(7) Integer dayOfWeek,
  @NotBlank String start,
  @NotBlank String end
) {
}
