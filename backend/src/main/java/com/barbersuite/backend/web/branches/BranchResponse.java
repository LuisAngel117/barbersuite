package com.barbersuite.backend.web.branches;

import java.util.UUID;

public record BranchResponse(
  UUID id,
  String name,
  String code,
  String timeZone,
  boolean active
) {
}
