package com.barbersuite.backend.auth;

import java.util.List;
import java.util.UUID;

public record AuthUser(
  UUID tenantId,
  UUID userId,
  String email,
  String passwordHash,
  List<String> roles
) {
}
