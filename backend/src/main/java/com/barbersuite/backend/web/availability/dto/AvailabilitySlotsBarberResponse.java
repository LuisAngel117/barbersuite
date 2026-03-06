package com.barbersuite.backend.web.availability.dto;

import java.util.List;
import java.util.UUID;

public record AvailabilitySlotsBarberResponse(
  UUID barberId,
  String barberName,
  List<String> slots
) {
}
