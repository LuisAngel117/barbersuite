package com.barbersuite.backend.web.context;

import com.barbersuite.backend.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.UUID;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class RequestContextControllerAdvice {

  @ModelAttribute
  void populateTenantContext(HttpServletRequest request) {
    Principal principal = request.getUserPrincipal();
    if (!(principal instanceof JwtAuthenticationToken jwtAuthenticationToken)) {
      return;
    }

    String tenantId = jwtAuthenticationToken.getToken().getClaimAsString("tenantId");
    if (tenantId == null || tenantId.isBlank()) {
      return;
    }

    TenantContext.setCurrentTenantId(UUID.fromString(tenantId));
  }
}
