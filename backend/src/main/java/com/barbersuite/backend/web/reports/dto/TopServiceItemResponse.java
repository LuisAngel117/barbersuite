package com.barbersuite.backend.web.reports.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TopServiceItemResponse(
  UUID serviceId,
  String serviceName,
  int quantity,
  BigDecimal revenue
) {
}
