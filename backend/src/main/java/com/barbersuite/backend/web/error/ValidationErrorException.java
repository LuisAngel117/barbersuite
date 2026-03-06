package com.barbersuite.backend.web.error;

public final class ValidationErrorException extends ApiBadRequestException {

  public ValidationErrorException(String message) {
    super("VALIDATION_ERROR", message);
  }
}
