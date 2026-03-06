package com.barbersuite.backend.web.staffadmin.dto;

import java.util.List;
import java.util.UUID;

public record BarberDetailResponse(
  UUID id,
  String fullName,
  String email,
  String phone,
  boolean active,
  List<BranchSummary> branches,
  List<ServiceSummary> services
) {
}
