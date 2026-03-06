package com.barbersuite.backend.web.cash.dto;

import com.barbersuite.backend.cash.PaymentMethod;
import java.math.BigDecimal;
import java.util.UUID;

public record PaymentResponse(
  UUID id,
  PaymentMethod method,
  BigDecimal amount,
  String reference
) {
}
