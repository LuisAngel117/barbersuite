package com.barbersuite.backend.web.debug;

import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.web.branch.BranchRequired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/_debug")
public class DebugBranchRequiredController {

  @GetMapping("/branch-required")
  @BranchRequired
  BranchDebugResponse branchRequired() {
    return new BranchDebugResponse(BranchContext.requireCurrentBranchId().toString());
  }

  record BranchDebugResponse(String branchId) {
  }
}
