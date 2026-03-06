package com.barbersuite.backend.web.appointments;

import com.barbersuite.backend.appointments.AppointmentStatus;
import java.time.Instant;
import java.util.UUID;

public record AppointmentResponse(
  UUID id,
  UUID clientId,
  UUID barberId,
  UUID serviceId,
  AppointmentStatus status,
  Instant startAt,
  Instant endAt,
  String notes,
  Instant createdAt,
  Instant updatedAt
) {
}
