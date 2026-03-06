package com.barbersuite.backend.web.clients;

import java.time.Instant;
import java.util.UUID;

public record ClientResponse(
  UUID id,
  String fullName,
  String phone,
  String email,
  String notes,
  boolean active,
  Instant createdAt
) {
}
