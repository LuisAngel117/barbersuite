package com.barbersuite.backend.context;

import java.util.Optional;
import java.util.UUID;

public final class TenantContext {

  private static final ThreadLocal<UUID> CURRENT_TENANT_ID = new ThreadLocal<>();

  private TenantContext() {
  }

  public static void setCurrentTenantId(UUID tenantId) {
    CURRENT_TENANT_ID.set(tenantId);
  }

  public static Optional<UUID> getCurrentTenantId() {
    return Optional.ofNullable(CURRENT_TENANT_ID.get());
  }

  public static UUID requireCurrentTenantId() {
    return getCurrentTenantId()
      .orElseThrow(() -> new IllegalStateException("Tenant context is not available."));
  }

  public static void clear() {
    CURRENT_TENANT_ID.remove();
  }
}
