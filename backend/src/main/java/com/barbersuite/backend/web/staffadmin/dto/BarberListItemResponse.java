package com.barbersuite.backend.web.staffadmin.dto;

import java.util.List;
import java.util.UUID;

public record BarberListItemResponse(
  UUID id,
  String fullName,
  String email,
  String phone,
  boolean active,
  List<BranchSummary> branches
) {
}
