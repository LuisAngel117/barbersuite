package com.barbersuite.backend.web.branch;

import com.barbersuite.backend.branchaccess.JdbcBranchAccessRepository;
import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.observability.BranchAccessMetrics;
import com.barbersuite.backend.web.RequestHeaderNames;
import com.barbersuite.backend.web.error.BranchForbiddenException;
import com.barbersuite.backend.web.error.BranchRequiredException;
import com.barbersuite.backend.web.error.InvalidBranchHeaderException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class BranchContextInterceptor implements HandlerInterceptor {

  private final JdbcBranchAccessRepository branchAccessRepository;
  private final BranchAccessMetrics branchAccessMetrics;

  public BranchContextInterceptor(
    JdbcBranchAccessRepository branchAccessRepository,
    BranchAccessMetrics branchAccessMetrics
  ) {
    this.branchAccessRepository = branchAccessRepository;
    this.branchAccessMetrics = branchAccessMetrics;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    BranchContext.clear();

    if (!(handler instanceof HandlerMethod handlerMethod)) {
      return true;
    }

    if (!isBranchRequired(handlerMethod)) {
      return true;
    }

    UUID branchId = resolveRequiredBranchId(request);
    Jwt jwt = requireAuthenticatedJwt();
    UUID tenantId = uuidClaim(jwt, "tenantId");
    UUID userId = uuidClaim(jwt, "userId");

    if (!branchAccessRepository.hasAccess(tenantId, userId, branchId)) {
      branchAccessMetrics.recordBranchForbidden();
      throw new BranchForbiddenException();
    }

    BranchContext.setCurrentBranchId(branchId);
    return true;
  }

  @Override
  public void afterCompletion(
    HttpServletRequest request,
    HttpServletResponse response,
    Object handler,
    Exception exception
  ) {
    BranchContext.clear();
  }

  private UUID resolveRequiredBranchId(HttpServletRequest request) {
    String headerValue = request.getHeader(RequestHeaderNames.BRANCH_ID);
    if (headerValue == null || headerValue.isBlank()) {
      branchAccessMetrics.recordBranchRequired();
      throw new BranchRequiredException();
    }

    try {
      return UUID.fromString(headerValue.trim());
    } catch (IllegalArgumentException exception) {
      throw new InvalidBranchHeaderException(headerValue);
    }
  }

  private Jwt requireAuthenticatedJwt() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
      throw new IllegalStateException("Missing authenticated JWT for branch-scoped request.");
    }
    return jwt;
  }

  private UUID uuidClaim(Jwt jwt, String claimName) {
    String claimValue = jwt.getClaimAsString(claimName);
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: " + claimName);
    }
    return UUID.fromString(claimValue);
  }

  private boolean isBranchRequired(HandlerMethod handlerMethod) {
    return AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), BranchRequired.class)
      || AnnotatedElementUtils.hasAnnotation(handlerMethod.getBeanType(), BranchRequired.class);
  }
}
