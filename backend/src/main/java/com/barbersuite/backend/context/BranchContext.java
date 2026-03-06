package com.barbersuite.backend.context;

import java.util.Optional;
import java.util.UUID;

public final class BranchContext {

  private static final ThreadLocal<UUID> CURRENT_BRANCH_ID = new ThreadLocal<>();

  private BranchContext() {
  }

  public static void setCurrentBranchId(UUID branchId) {
    CURRENT_BRANCH_ID.set(branchId);
  }

  public static Optional<UUID> getCurrentBranchId() {
    return Optional.ofNullable(CURRENT_BRANCH_ID.get());
  }

  public static UUID requireCurrentBranchId() {
    return getCurrentBranchId()
      .orElseThrow(() -> new IllegalStateException("Branch context is not available."));
  }

  public static void clear() {
    CURRENT_BRANCH_ID.remove();
  }
}
