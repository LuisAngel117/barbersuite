package com.barbersuite.backend.web.staffadmin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record PatchBarberRequest(
  @Size(min = 2) String fullName,
  String phone,
  Boolean active,
  List<@NotNull UUID> branchIds,
  List<@NotNull UUID> serviceIds,
  @Size(min = 8) String password
) {
}
