package com.barbersuite.backend.web.reports.dto;

import java.util.List;

public record TopServicesResponse(
  String currency,
  List<TopServiceItemResponse> items
) {
}
