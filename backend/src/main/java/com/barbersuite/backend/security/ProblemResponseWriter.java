package com.barbersuite.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

final class ProblemResponseWriter {

  private ProblemResponseWriter() {
  }

  static void write(
    HttpServletResponse response,
    ObjectMapper objectMapper,
    HttpStatus status,
    String title,
    String detail,
    String code,
    String instance
  ) throws IOException {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("type", URI.create("about:blank").toString());
    body.put("title", title);
    body.put("status", status.value());
    body.put("detail", detail);
    body.put("instance", instance);
    body.put("code", code);

    response.setStatus(status.value());
    response.setCharacterEncoding("UTF-8");
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), body);
  }
}
