package com.barbersuite.backend.web.clients.history.dto;

import com.barbersuite.backend.cash.ReceiptStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ClientHistoryReceipt(
  UUID id,
  String number,
  ReceiptStatus status,
  Instant issuedAt,
  BigDecimal total
) {
}
