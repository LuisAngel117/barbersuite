package com.barbersuite.backend.web.availability.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AvailabilityExceptionDto(
  @NotBlank String date,
  @NotBlank String type,
  String note,
  List<@Valid ExceptionInterval> intervals
) {
}
