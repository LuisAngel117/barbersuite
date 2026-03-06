package com.barbersuite.backend.web.cash.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateReceiptRequest(
  UUID clientId,
  UUID appointmentId,
  String notes,
  @DecimalMin("0.00") BigDecimal discount,
  @DecimalMin("0.00") BigDecimal tax,
  @NotNull @Size(min = 1) List<@Valid @NotNull CreateReceiptItemRequest> items,
  @NotNull @Size(min = 1) List<@Valid @NotNull CreateReceiptPaymentRequest> payments
) {
}
