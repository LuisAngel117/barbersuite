package com.barbersuite.backend.web.availability.dto;

import java.util.List;
import java.util.UUID;

public record AvailabilityBarberResponse(
  UUID barberId,
  String barberName,
  List<WeeklyInterval> weekly,
  List<AvailabilityExceptionDto> exceptions
) {
}
