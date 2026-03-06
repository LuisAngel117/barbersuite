package com.barbersuite.backend.web.clients;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record PatchClientRequest(
  @Size(min = 2) String fullName,
  String phone,
  @Email String email,
  String notes,
  Boolean active
) {
}
