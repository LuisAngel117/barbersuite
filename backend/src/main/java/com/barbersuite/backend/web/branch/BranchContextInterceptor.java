package com.barbersuite.backend.web.branch;

import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.web.RequestHeaderNames;
import com.barbersuite.backend.web.error.BranchRequiredException;
import com.barbersuite.backend.web.error.InvalidBranchHeaderException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import java.util.UUID;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class BranchContextInterceptor implements HandlerInterceptor {

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    BranchContext.clear();

    if (!(handler instanceof HandlerMethod handlerMethod)) {
      return true;
    }

    resolveBranchId(request).ifPresent(BranchContext::setCurrentBranchId);

    if (isBranchRequired(handlerMethod) && BranchContext.getCurrentBranchId().isEmpty()) {
      throw new BranchRequiredException();
    }

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

  private Optional<UUID> resolveBranchId(HttpServletRequest request) {
    String headerValue = request.getHeader(RequestHeaderNames.BRANCH_ID);
    if (headerValue == null || headerValue.isBlank()) {
      return Optional.empty();
    }

    try {
      return Optional.of(UUID.fromString(headerValue.trim()));
    } catch (IllegalArgumentException exception) {
      throw new InvalidBranchHeaderException(headerValue);
    }
  }

  private boolean isBranchRequired(HandlerMethod handlerMethod) {
    return AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), BranchRequired.class)
      || AnnotatedElementUtils.hasAnnotation(handlerMethod.getBeanType(), BranchRequired.class);
  }
}
