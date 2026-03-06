package com.barbersuite.backend.web.error;

public final class ServiceNameAlreadyExistsException extends ApiConflictException {

  public ServiceNameAlreadyExistsException() {
    super("CONFLICT", "Service name already exists for this tenant.");
  }
}
