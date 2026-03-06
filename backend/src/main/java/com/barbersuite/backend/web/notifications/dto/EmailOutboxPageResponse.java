package com.barbersuite.backend.web.notifications.dto;

import java.util.List;

public record EmailOutboxPageResponse(
  List<EmailOutboxItemResponse> items,
  int page,
  int size,
  long totalItems,
  int totalPages
) {
}
