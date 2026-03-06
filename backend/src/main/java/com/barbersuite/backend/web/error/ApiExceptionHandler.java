package com.barbersuite.backend.web.error;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
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
      request,
      problemDetail -> {
      }
    );
  }

  @ExceptionHandler(ApiConflictException.class)
  ResponseEntity<ProblemDetail> handleConflict(
    ApiConflictException exception,
    HttpServletRequest request
  ) {
    return problemResponse(
      HttpStatus.CONFLICT,
      "Conflict",
      exception.getMessage(),
      exception.getCode(),
      request,
      problemDetail -> {
      }
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
      request,
      problemDetail -> {
      }
    );
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> handleMethodArgumentNotValid(
    MethodArgumentNotValidException exception,
    HttpServletRequest request
  ) {
    List<Map<String, String>> errors = exception.getBindingResult().getFieldErrors().stream()
      .map(fieldError -> Map.of(
        "field",
        fieldError.getField(),
        "message",
        fieldError.getDefaultMessage() == null ? "Invalid value." : fieldError.getDefaultMessage()
      ))
      .toList();

    return problemResponse(
      HttpStatus.BAD_REQUEST,
      "Bad Request",
      "One or more fields are invalid.",
      "VALIDATION_ERROR",
      request,
      problemDetail -> problemDetail.setProperty("errors", errors)
    );
  }

  private ResponseEntity<ProblemDetail> problemResponse(
    HttpStatus status,
    String title,
    String detail,
    String code,
    HttpServletRequest request,
    Consumer<ProblemDetail> customizer
  ) {
    ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, detail);
    problemDetail.setTitle(title);
    problemDetail.setType(URI.create("about:blank"));
    problemDetail.setInstance(URI.create(request.getRequestURI()));
    problemDetail.setProperty("code", code);
    customizer.accept(problemDetail);

    return ResponseEntity.status(status)
      .contentType(MediaType.APPLICATION_PROBLEM_JSON)
      .body(problemDetail);
  }
}
