package com.barbersuite.backend.web.services;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceResponse(
  UUID id,
  String name,
  int durationMinutes,
  BigDecimal price,
  boolean active
) {
}
