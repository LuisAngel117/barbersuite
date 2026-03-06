package com.barbersuite.backend.web.clients.history.dto;

import java.util.List;

public record ClientHistoryResponse(
  ClientHistoryClient client,
  List<ClientHistoryAppointment> appointments,
  List<ClientHistoryReceipt> receipts,
  ClientHistoryStats stats
) {
}
