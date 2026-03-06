package com.barbersuite.backend.web.cash.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ReceiptItemResponse(
  UUID id,
  UUID serviceId,
  String description,
  int quantity,
  BigDecimal unitPrice,
  BigDecimal lineTotal
) {
}
