package com.barbersuite.backend.web.cash.dto;

import java.util.List;

public record ReceiptPageResponse(
  List<ReceiptResponse> items,
  int page,
  int size,
  long totalItems,
  int totalPages
) {
}
