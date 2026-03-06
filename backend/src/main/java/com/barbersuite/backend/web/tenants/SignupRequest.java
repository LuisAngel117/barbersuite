package com.barbersuite.backend.web.tenants;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
  @NotBlank @Size(min = 2) String tenantName,
  @NotBlank @Size(min = 2) String branchName,
  @NotBlank @Pattern(regexp = "^[A-Z0-9]{2,10}$") String branchCode,
  @NotBlank String timeZone,
  @NotBlank @Size(min = 2) String adminFullName,
  @NotBlank @Email String adminEmail,
  @NotBlank @Size(min = 8) String adminPassword
) {
}
