package com.barbersuite.backend.web.error;

public abstract class ApiNotFoundException extends RuntimeException {

  private final String code;

  protected ApiNotFoundException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
