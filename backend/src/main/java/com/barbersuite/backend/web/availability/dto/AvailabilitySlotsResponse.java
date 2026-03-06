package com.barbersuite.backend.web.availability.dto;

import java.util.List;

public record AvailabilitySlotsResponse(
  String timeZone,
  List<AvailabilitySlotsBarberResponse> items
) {
}
