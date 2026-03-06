package com.barbersuite.backend.web.staffadmin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreateBarberRequest(
  @NotBlank @Size(min = 2) String fullName,
  @NotBlank @Email String email,
  String phone,
  @NotBlank @Size(min = 8) String password,
  @NotNull @Size(min = 1) List<@NotNull UUID> branchIds,
  List<@NotNull UUID> serviceIds,
  Boolean active
) {
}
