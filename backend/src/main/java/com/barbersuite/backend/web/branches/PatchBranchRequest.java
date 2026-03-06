package com.barbersuite.backend.web.branches;

import jakarta.validation.constraints.Size;

public record PatchBranchRequest(
  @Size(min = 2) String name,
  String timeZone,
  Boolean active
) {
}
