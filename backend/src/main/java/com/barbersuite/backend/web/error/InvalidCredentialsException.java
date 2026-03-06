package com.barbersuite.backend.web.error;

public final class InvalidCredentialsException extends RuntimeException {

  public InvalidCredentialsException() {
    super("Invalid email or password.");
  }

  public String getCode() {
    return "INVALID_CREDENTIALS";
  }
}
