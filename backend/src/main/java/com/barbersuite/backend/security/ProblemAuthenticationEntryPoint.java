package com.barbersuite.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

public class ProblemAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  public ProblemAuthenticationEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
    HttpServletRequest request,
    HttpServletResponse response,
    AuthenticationException authException
  ) throws IOException, ServletException {
    ProblemResponseWriter.write(
      response,
      objectMapper,
      HttpStatus.UNAUTHORIZED,
      "Unauthorized",
      "Authentication is required to access this resource.",
      "UNAUTHORIZED",
      request.getRequestURI()
    );
  }
}
