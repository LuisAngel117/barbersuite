package com.barbersuite.backend.web.tenants;

import java.util.UUID;

public record SignupResponse(
  UUID tenantId,
  UUID branchId,
  UUID userId,
  String accessToken,
  String tokenType,
  int expiresIn
) {
}
