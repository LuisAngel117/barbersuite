package com.barbersuite.backend.web.staffadmin.dto;

import java.util.UUID;

public record BranchSummary(
  UUID id,
  String name,
  String code,
  boolean active
) {
}
