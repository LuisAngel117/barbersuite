package com.barbersuite.backend.web.clients.history.dto;

import java.math.BigDecimal;

public record ClientHistoryStats(
  int totalVisits,
  int noShows,
  BigDecimal totalSpend
) {
}
