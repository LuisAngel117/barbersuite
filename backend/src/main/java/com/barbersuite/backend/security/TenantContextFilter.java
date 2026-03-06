package com.barbersuite.backend.security;

import com.barbersuite.backend.context.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

public class TenantContextFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    TenantContext.clear();
    resolveTenantIdFromAuthentication().ifPresent(TenantContext::setCurrentTenantId);

    try {
      filterChain.doFilter(request, response);
    } finally {
      TenantContext.clear();
    }
  }

  private java.util.Optional<UUID> resolveTenantIdFromAuthentication() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (!(authentication instanceof JwtAuthenticationToken jwtAuthenticationToken)) {
      return java.util.Optional.empty();
    }

    String tenantId = jwtAuthenticationToken.getToken().getClaimAsString("tenantId");
    if (tenantId == null || tenantId.isBlank()) {
      return java.util.Optional.empty();
    }

    return java.util.Optional.of(UUID.fromString(tenantId));
  }
}
