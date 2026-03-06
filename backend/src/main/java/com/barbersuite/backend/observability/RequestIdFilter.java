package com.barbersuite.backend.observability;

import com.barbersuite.backend.web.RequestHeaderNames;
import com.barbersuite.backend.web.error.InvalidRequestIdHeaderException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Component
public class RequestIdFilter extends OncePerRequestFilter {

  private static final String MDC_KEY = "requestId";
  private static final int MAX_REQUEST_ID_LENGTH = 100;

  private final HandlerExceptionResolver handlerExceptionResolver;

  public RequestIdFilter(
    @Qualifier("handlerExceptionResolver") HandlerExceptionResolver handlerExceptionResolver
  ) {
    this.handlerExceptionResolver = handlerExceptionResolver;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String rawRequestId = request.getHeader(RequestHeaderNames.REQUEST_ID);
    String requestId = resolveRequestId(rawRequestId);

    MDC.put(MDC_KEY, requestId);
    response.setHeader(RequestHeaderNames.REQUEST_ID, requestId);

    try {
      if (isInvalid(rawRequestId)) {
        handlerExceptionResolver.resolveException(
          request,
          response,
          null,
          new InvalidRequestIdHeaderException()
        );
        return;
      }

      filterChain.doFilter(request, response);
    } finally {
      MDC.remove(MDC_KEY);
    }
  }

  private String resolveRequestId(String rawRequestId) {
    if (rawRequestId == null || isInvalid(rawRequestId)) {
      return UUID.randomUUID().toString();
    }
    return rawRequestId.trim();
  }

  private boolean isInvalid(String rawRequestId) {
    return rawRequestId != null
      && (rawRequestId.isBlank() || rawRequestId.trim().length() > MAX_REQUEST_ID_LENGTH);
  }
}
