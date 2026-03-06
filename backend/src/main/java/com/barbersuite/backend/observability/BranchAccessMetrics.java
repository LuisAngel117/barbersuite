package com.barbersuite.backend.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class BranchAccessMetrics {

  private final Counter branchRequiredCounter;
  private final Counter branchForbiddenCounter;

  public BranchAccessMetrics(MeterRegistry meterRegistry) {
    this.branchRequiredCounter = Counter.builder("barbersuite_branch_required_total")
      .description("Total branch-scoped requests rejected because X-Branch-Id was missing.")
      .register(meterRegistry);
    this.branchForbiddenCounter = Counter.builder("barbersuite_branch_forbidden_total")
      .description("Total branch-scoped requests rejected because the user had no branch access.")
      .register(meterRegistry);
  }

  public void recordBranchRequired() {
    branchRequiredCounter.increment();
  }

  public void recordBranchForbidden() {
    branchForbiddenCounter.increment();
  }
}
