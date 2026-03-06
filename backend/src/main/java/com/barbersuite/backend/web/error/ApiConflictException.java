package com.barbersuite.backend.web.error;

public abstract class ApiConflictException extends RuntimeException {

  private final String code;

  protected ApiConflictException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
