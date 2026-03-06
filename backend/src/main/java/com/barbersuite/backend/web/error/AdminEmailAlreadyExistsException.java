package com.barbersuite.backend.web.error;

public final class AdminEmailAlreadyExistsException extends ApiConflictException {

  public AdminEmailAlreadyExistsException() {
    super("CONFLICT", "Admin email already exists.");
  }
}
