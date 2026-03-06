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
    return problemResponse(
      HttpStatus.BAD_REQUEST,
      "Bad Request",
      exception.getMessage(),
      exception.getCode(),
      request
    );
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  ResponseEntity<ProblemDetail> handleInvalidCredentials(
    InvalidCredentialsException exception,
    HttpServletRequest request
  ) {
    return problemResponse(
      HttpStatus.UNAUTHORIZED,
      "Unauthorized",
      exception.getMessage(),
      exception.getCode(),
      request
    );
  }

  private ResponseEntity<ProblemDetail> problemResponse(
    HttpStatus status,
    String title,
    String detail,
    String code,
    HttpServletRequest request
  ) {
    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
    problemDetail.setTitle(title);
    problemDetail.setType(URI.create("about:blank"));
    problemDetail.setInstance(URI.create(request.getRequestURI()));
    problemDetail.setProperty("code", code);

    return ResponseEntity.status(status)
      .contentType(MediaType.APPLICATION_PROBLEM_JSON)
      .body(problemDetail);
  }
}
