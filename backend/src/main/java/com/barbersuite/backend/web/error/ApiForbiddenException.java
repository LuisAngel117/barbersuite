package com.barbersuite.backend.web.error;

public abstract class ApiForbiddenException extends RuntimeException {

  private final String code;

  protected ApiForbiddenException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
