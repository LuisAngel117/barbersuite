package com.barbersuite.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;

public class ProblemAccessDeniedHandler implements AccessDeniedHandler {

  private final ObjectMapper objectMapper;

  public ProblemAccessDeniedHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void handle(
    HttpServletRequest request,
    HttpServletResponse response,
    AccessDeniedException accessDeniedException
  ) throws IOException, ServletException {
    ProblemResponseWriter.write(
      response,
      objectMapper,
      HttpStatus.FORBIDDEN,
      "Forbidden",
      "The authenticated user does not have the required role.",
      "FORBIDDEN",
      request.getRequestURI()
    );
  }
}
