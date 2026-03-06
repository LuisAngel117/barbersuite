package com.barbersuite.backend.web.cash.dto;

import com.barbersuite.backend.cash.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateReceiptPaymentRequest(
  @NotNull PaymentMethod method,
  @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
  String reference
) {
}
