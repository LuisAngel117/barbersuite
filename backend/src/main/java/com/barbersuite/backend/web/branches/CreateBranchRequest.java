package com.barbersuite.backend.web.branches;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateBranchRequest(
  @NotBlank @Size(min = 2) String name,
  @NotBlank @Pattern(regexp = "^[A-Z0-9]{2,10}$") String code,
  @NotBlank String timeZone
) {
}
