package com.barbersuite.backend.web.clients.history.dto;

import com.barbersuite.backend.appointments.AppointmentStatus;
import java.time.Instant;
import java.util.UUID;

public record ClientHistoryAppointment(
  UUID id,
  AppointmentStatus status,
  Instant startAt,
  Instant endAt,
  UUID barberId,
  String barberName,
  UUID serviceId,
  String serviceName
) {
}
