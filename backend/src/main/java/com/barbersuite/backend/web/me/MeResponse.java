package com.barbersuite.backend.web.me;

import java.util.List;
import java.util.UUID;

public record MeResponse(
  TenantView tenant,
  UserView user,
  List<BranchView> branches
) {

  public record TenantView(UUID id, String name) {
  }

  public record UserView(UUID id, String fullName, String email, List<String> roles) {
  }

  public record BranchView(
    UUID id,
    String name,
    String code,
    String timeZone,
    boolean active
  ) {
  }
}
