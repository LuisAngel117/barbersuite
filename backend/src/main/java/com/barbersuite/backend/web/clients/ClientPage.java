package com.barbersuite.backend.web.clients;

import java.util.List;

public record ClientPage(
  List<ClientResponse> items,
  int page,
  int size,
  long totalItems,
  int totalPages
) {
}
