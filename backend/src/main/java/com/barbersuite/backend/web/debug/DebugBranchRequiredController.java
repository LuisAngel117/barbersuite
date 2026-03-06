package com.barbersuite.backend.web.debug;

import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.context.TenantContext;
import com.barbersuite.backend.web.branch.BranchRequired;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

  @GetMapping("/protected")
  ProtectedDebugResponse protectedEndpoint(@AuthenticationPrincipal Jwt jwt) {
    return new ProtectedDebugResponse(
      resolveTenantId(jwt).toString(),
      jwt.getClaimAsString("userId"),
      jwt.getClaimAsStringList("roles")
    );
  }

  private UUID resolveTenantId(Jwt jwt) {
    return TenantContext.getCurrentTenantId().orElseGet(() -> {
      UUID tenantId = UUID.fromString(jwt.getClaimAsString("tenantId"));
      TenantContext.setCurrentTenantId(tenantId);
      return tenantId;
    });
  }

  record BranchDebugResponse(String branchId) {
  }

  record ProtectedDebugResponse(String tenantId, String userId, List<String> roles) {
  }
}
