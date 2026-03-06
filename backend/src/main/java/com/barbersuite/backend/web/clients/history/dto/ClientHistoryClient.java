package com.barbersuite.backend.web.clients.history.dto;

import java.time.Instant;
import java.util.UUID;

public record ClientHistoryClient(
  UUID id,
  String fullName,
  String phone,
  String email,
  String notes,
  boolean active,
  Instant createdAt
) {
}
