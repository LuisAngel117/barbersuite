package com.barbersuite.backend.web.cash.dto;

import com.barbersuite.backend.cash.ReceiptStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReceiptResponse(
  UUID id,
  String number,
  ReceiptStatus status,
  UUID clientId,
  UUID appointmentId,
  Instant issuedAt,
  BigDecimal subtotal,
  BigDecimal discount,
  BigDecimal tax,
  BigDecimal total,
  String notes,
  List<ReceiptItemResponse> items,
  List<PaymentResponse> payments,
  Instant createdAt,
  Instant updatedAt
) {
}
