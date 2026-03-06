package com.barbersuite.backend.web.error;

public abstract class ApiBadRequestException extends RuntimeException {

  private final String code;

  protected ApiBadRequestException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String getCode() {
    return code;
  }
}
