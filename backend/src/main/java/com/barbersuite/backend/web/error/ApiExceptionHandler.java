package com.barbersuite.backend.web.error;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ApiBadRequestException.class)
  ResponseEntity<ProblemDetail> handleBadRequest(
    ApiBadRequestException exception,
    HttpServletRequest request
  ) {
    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
      HttpStatus.BAD_REQUEST,
      exception.getMessage()
    );
    problemDetail.setTitle("Bad Request");
    problemDetail.setType(URI.create("about:blank"));
    problemDetail.setInstance(URI.create(request.getRequestURI()));
    problemDetail.setProperty("code", exception.getCode());

    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
      .contentType(MediaType.APPLICATION_PROBLEM_JSON)
      .body(problemDetail);
  }
}
