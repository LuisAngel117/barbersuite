package com.barbersuite.backend.web.availability.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record PutAvailabilityRequest(
  @NotNull List<@Valid WeeklyInterval> weekly,
  @NotNull List<@Valid AvailabilityExceptionDto> exceptions
) {
}
