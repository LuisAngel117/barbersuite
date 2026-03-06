package com.barbersuite.backend.web.staffadmin.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceSummary(
  UUID id,
  String name,
  BigDecimal price,
  int durationMinutes,
  boolean active
) {
}
